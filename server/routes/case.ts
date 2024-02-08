import { Router } from 'express'
import type { Services } from '../services'

export default function caseViewRoutes(router: Router, services: Services) {
  router.get('/case/:crn', (req, res) => res.render('pages/case', { crn: req.params.crn }))
}
