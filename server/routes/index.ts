import { type RequestHandler, Router } from 'express'

import probationSearchRoutes from '@ministryofjustice/probation-search-frontend/routes/search'
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
    allowEmptyQuery: true,
    environment: config.environment,
    oauthClient: service.hmppsAuthClient,
  })

  get('/newTech/help', (req, res) => res.render('pages/newTech/help'))

  return router
}
