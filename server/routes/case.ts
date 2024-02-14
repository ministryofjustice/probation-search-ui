import { type RequestHandler, Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function caseViewRoutes(router: Router) {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn', async (req, res, _next) => {
    const { crn } = req.params
    await auditService.sendAuditMessage({
      action: 'VIEW_CASE_DETAILS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'probation-search-ui',
    })
    res.render('pages/case', { crn })
  })
}
