import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'

/**
 * Sends HMPPS Audit Events
 *
 * Sends 1 event to audit the SEARCHED_PERFORMED action using the search input
 * Sends a VIEWED_RESULTS_PAGE_X event for each of the returned crns in the search results, where X is the page number
 *
 * @param request the ProbationSearchRequest
 * @param response the ProbationSearchResponse
 * @param username the username
 */
export default function hmppsAudit(
  request: ProbationSearchRequest,
  response: ProbationSearchResponse,
  username: string,
): void {
  if (response === undefined) {
    return
  }
  auditService.sendAuditMessage({
    action: `SEARCH_PERFORMED`,
    who: username,
    subjectId: request.query,
    subjectType: 'SEARCH_INPUT',
    correlationId: v4(),
    service: 'probation-search-ui',
  })

  response.content.forEach(result => {
    auditService.sendAuditMessage({
      action: `VIEWED_RESULTS_PAGE_${request.pageNumber}`,
      who: username,
      subjectId: result.otherIds.crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'probation-search-ui',
    })
  })
}
