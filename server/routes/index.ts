import { type RequestHandler, Router } from 'express'

import probationSearchRoutes from '@ministryofjustice/probation-search-frontend/routes/search'
import nunjucks from 'nunjucks'
import { ProbationSearchResponse } from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
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

  // Delius search screen (fka new tech)
  probationSearchRoutes({
    router,
    path: '/newTech',
    template: 'pages/newTech/index',
    responseFormatter: response => nunjucks.render('pages/newTech/results.njk', { results: mapResults(response) }),
    allowEmptyQuery: true,
    environment: config.environment,
    oauthClient: service.hmppsAuthClient,
  })

  get('/newTech/help', (req, res) => res.render('pages/newTech/help'))

  return router
}

function mapResults(response: ProbationSearchResponse) {
  return response.content.map(result => {
    const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
    return {
      ...result,
      provider: activeManager.probationArea.description,
      officer: `${activeManager.staff.surname}, ${activeManager.staff.forenames}`,
    }
  })
}
