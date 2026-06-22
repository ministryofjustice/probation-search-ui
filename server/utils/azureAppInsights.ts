import type { Request } from 'express'
import { initialiseTelemetry, flushTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import logger from '../../logger'

initialiseTelemetry({
  serviceName: 'probation-search-ui',
  serviceVersion: process.env.BUILD_NUMBER || 'unknown',
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(telemetry.processors.filterSpanWherePath(['/health', '/ping', '/info', '/assets/*', '/favicon.ico']))
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down...`)
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default class ApplicationInsightsEvents {
  static searchPerformed(request: ProbationSearchRequest, response: ProbationSearchResponse, username: string) {
    telemetry.trackEvent('SearchPerformed', {
      'query.length': request.query.length,
      'query.tokens': countTokens(request.query),
      matchAllTerms: request.matchAllTerms,
      providersFilter: request.providersFilter.join(','),
      pageNumber: request.pageNumber,
      asUsername: username,
      'response.size': response.size,
      'response.totalElements': response.totalElements,
      'response.totalPages': response.totalPages,
      'response.suggestions': JSON.stringify(
        Object.values(response?.suggestions?.suggest || {})
          .flatMap(suggestions => suggestions.flatMap(s => s.options.map(o => ({ ...s, ...o }))))
          .sort((a, b) => b.score - a.score || b.freq - a.freq)
          .map(s => s.text),
      ),
      'response.probationAreaAggregations': JSON.stringify(
        Object.fromEntries(response.probationAreaAggregations.map(p => [p.description, p.count])),
      ),
      'response.content': JSON.stringify(response.content.map(result => result.otherIds.crn)),
    })
  }

  static trackEvent(req: Request) {
    telemetry.trackEvent(ApplicationInsightsEvents.mapActionToEventName(req.body.action), {
      'query.length': req.session.probationSearch?.query?.length ?? 0,
      'query.tokens': countTokens(req.session.probationSearch?.query),
      matchAllTerms: req.session.probationSearch?.matchAllTerms ?? '',
      providersFilter: req.session.probationSearch?.providers?.join(',') ?? '',
      asUsername: req.user.username,
      pageNumber: toNumber(req.session.probationSearch?.page),
      selectedResult: req.body.index ?? '',
      selectedCrn: req.body.crn ?? '',
    })
  }

  private static mapActionToEventName(action: string): string {
    if (action === 'viewOffender') return 'ResultSelected'
    if (action === 'addContact') return 'AddContactSelected'
    if (action === 'addOffender') return 'AddPersonSelected'
    if (action === 'toggleSearch') return 'NavigatedToPreviousSearch'
    return action
  }
}

function countTokens(query?: string): number {
  return query?.trim() ? query.trim().split(/\s+/).length : 0
}

function toNumber(value?: string | string[]): number {
  const normalised = Array.isArray(value) ? value[0] : value
  return Number(normalised ?? 0)
}
