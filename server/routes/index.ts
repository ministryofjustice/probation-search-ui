import { type RequestHandler, Router } from 'express'

import probationSearchRoutes from '@ministryofjustice/probation-search-frontend/routes/search'
import nunjucks from 'nunjucks'
import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import parseurl from 'parseurl'
import asyncMiddleware from '../middleware/asyncMiddleware'
import config from '../config'
import type { Services } from '../services'
import PrisonApiClient from '../data/prisonApiClient'
import { HmppsAuthClient } from '../data'

export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/info', (req, res) =>
    res.send({
      productId: config.productId,
    }),
  )

  // Home page
  probationSearchRoutes({
    router,
    path: '/',
    template: 'pages/index',
    environment: config.environment,
    oauthClient: service.hmppsAuthClient,
  })

  // Examples page
  probationSearchRoutes({
    router,
    path: '/examples',
    template: 'pages/examples',
    environment: config.environment,
    oauthClient: service.hmppsAuthClient,
  })

  // Delius search screen (fka new tech)
  probationSearchRoutes({
    router,
    path: '/delius/nationalSearch',
    template: 'pages/deliusSearch/index',
    templateFields: () => ({ deliusUrl: config.delius.url }),
    resultsFormatter: async (res, req) =>
      nunjucks.render('pages/deliusSearch/results.njk', mapResults(res, req, service.hmppsAuthClient)),
    allowEmptyQuery: true,
    environment: config.environment,
    oauthClient: service.hmppsAuthClient,
  })

  get('/delius/nationalSearch/help', (req, res) =>
    res.render('pages/deliusSearch/help', { query: parseurl.original(req).query }),
  )

  return router
}

async function mapResults(
  response: ProbationSearchResponse,
  request: ProbationSearchRequest,
  hmppsAuthClient: HmppsAuthClient,
) {
  const token = await hmppsAuthClient.getSystemClientToken()
  const prisonApiClient = new PrisonApiClient(token)
  return {
    results: await Promise.all(
      response.content.map(async result => {
        const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
        return {
          ...result,
          imageUrl: await prisonApiClient.getImageUrl(result.otherIds.nomsNumber),
          provider: activeManager.probationArea.description,
          officer: `${activeManager.staff.surname}, ${activeManager.staff.forenames}`,
        }
      }),
    ),
    providers: response.probationAreaAggregations
      .map(p => ({
        value: p.code,
        text: `${p.description} (${p.count})`,
        checked: request.providersFilter.includes(p.code),
      }))
      .sort((a, b) => a.text?.localeCompare(b.text)),
    matchAllTerms: request.matchAllTerms,
    deliusUrl: config.delius.url,
  }
}
