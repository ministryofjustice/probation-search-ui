import { Router } from 'express'
import type { Services } from '../services'

export default function exampleRoutes(router: Router, services: Services) {
  router.post('/examples', services.searchService.post)
  router.get('/examples', services.searchService.get, (req, res) => res.render('pages/examples'))
}
