import type { Request, Response, NextFunction } from 'express'
import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import logger from '../../logger'
import config from '../config'

/**
 * Sends HMPPS Audit Events
 *
 * Sends 1 event to audit the SEARCHED_PERFORMED action using the search input
 * Sends a VIEWED_RESULTS event for each of the returned crns in the search results
 *
 * @param req The Request
 * @param res The Response
 * @param next The NextFunction
 */
export default function hmppsAudit(req: Request, res: Response, next: NextFunction): void {
  if (res.locals.searchRequest === undefined) {
    return next()
  }
  if (config.hmppsAudit.enabled === false) {
    logger.warn('HMPPS Audit is not configured')
    return next()
  }
  const request: ProbationSearchRequest = res.locals.searchRequest
  const response: ProbationSearchResponse = res.locals.searchResponse
  const userName = req.user.username

  auditService.sendAuditMessage({
    action: `SEARCH_PERFORMED`,
    who: userName,
    subjectId: request.query,
    subjectType: 'SEARCH_INPUT',
    correlationId: v4(),
    service: 'probation-search-ui',
  })

  response.content.forEach(result => {
    auditService.sendAuditMessage({
      action: `VIEWED_RESULTS`,
      who: userName,
      subjectId: result.otherIds.crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'probation-search-ui',
    })
  })
  return next()
}
