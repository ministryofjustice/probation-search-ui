import { Router } from 'express'

export default function caseViewRoutes(router: Router) {
  router.get('/case/:crn', (req, res) => res.render('pages/case', { crn: req.params.crn }))
}
