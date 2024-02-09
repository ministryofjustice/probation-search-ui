import { Router } from 'express'
import config from '../config'
import type { Services } from '../services'
import deliusRoutes from './delius'
import searchRoutes from './search'
import exampleRoutes from './examples'
import caseViewRoutes from './case'

export default function routes(services: Services): Router {
  const router = Router()

  router.get('/info', (req, res) =>
    res.send({
      productId: config.productId,
    }),
  )

  // Home page
  router.get('/', (req, res) => res.redirect('/search'))

  searchRoutes(router, services)
  exampleRoutes(router, services)
  deliusRoutes(router, services)
  caseViewRoutes(router)

  return router
}
