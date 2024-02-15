import { Router } from 'express'
import type { Services } from '../services'

export default function searchRoutes(router: Router, services: Services) {
  /**
   * Configure GET and POST routes using the corresponding CaseSearchService middlewares.
   *
   */
  router.post('/search', services.searchService.post)
  router.get('/search', services.searchService.get, (_req, res) => res.render('pages/search'))

  return router
}
