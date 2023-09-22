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

export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/info', (req, res) =>
    res.send({
      productId: config.productId,
    }),
  )

  // Home page - example search
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
    resultsFormatter: async (res, req) => nunjucks.render('pages/deliusSearch/results.njk', mapResults(res, req)),
    allowEmptyQuery: true,
    environment: config.environment,
    oauthClient: service.hmppsAuthClient,
  })

  get('/delius/nationalSearch/help', (req, res) =>
    res.render('pages/deliusSearch/help', { query: parseurl.original(req).query }),
  )

  return router
}

function mapResults(response: ProbationSearchResponse, request: ProbationSearchRequest) {
  return {
    results: response.content.map(result => {
      const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
      return {
        ...result,
        provider: activeManager.probationArea.description,
        officer: `${activeManager.staff.surname}, ${activeManager.staff.forenames}`,
      }
    }),
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
