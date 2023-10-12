import { defaultClient, DistributedTracingModes, setup, TelemetryClient } from 'applicationinsights'
import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { Request } from 'express'
import type { ApplicationInfo } from '../applicationInfo'

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(
  { applicationName, buildNumber }: ApplicationInfo,
  overrideName?: string,
): TelemetryClient {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    defaultClient.context.tags['ai.cloud.role'] = overrideName || applicationName
    defaultClient.context.tags['ai.application.ver'] = buildNumber
    defaultClient.addTelemetryProcessor(({ data }) => {
      const { url } = data.baseData
      return !url?.endsWith('/health') && !url?.endsWith('/ping') && !url?.endsWith('/metrics')
    })
    return defaultClient
  }
  return null
}

export default class ApplicationInsightsEvents {
  static searchPerformed(request: ProbationSearchRequest, response: ProbationSearchResponse) {
    defaultClient?.trackEvent({
      name: 'SearchPerformed',
      properties: {
        query: request.query,
        matchAllTerms: request.matchAllTerms,
        providersFilter: request.providersFilter,
        pageNumber: request.pageNumber,
        asUsername: request.asUsername,
        response: {
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          suggestions: Object.values(response?.suggestions?.suggest || {})
            .flatMap(suggestions => suggestions.flatMap(s => s.options.map(o => ({ ...s, ...o }))))
            .sort((a, b) => b.score - a.score || b.freq - a.freq)
            .map(s => s.text),
          probationAreaAggregations: Object.fromEntries(
            response.probationAreaAggregations.map(p => [p.description, p.count]),
          ),
          content: response.content.map(result => result.otherIds.crn),
        },
      },
    })
  }

  static trackEvent(req: Request) {
    defaultClient?.trackEvent({
      name: ApplicationInsightsEvents.mapActionToEventName(req.body.action),
      properties: {
        query: req.session.probationSearch.q,
        matchAllTerms: req.session.probationSearch.matchAllTerms,
        providersFilter: req.session.probationSearch.providers,
        asUsername: req.user.username,
        pageNumber: req.session.probationSearch.page,
        selectedResult: req.body.index,
        selectedCrn: req.body.crn,
      },
    })
  }

  private static mapActionToEventName(action: string): string {
    if (action === 'viewOffender') return 'ResultSelected'
    if (action === 'addContact') return 'AddContactSelected'
    if (action === 'addPerson') return 'AddPersonSelected'
    if (action === 'toggleSearch') return 'NavigatedToPreviousSearch'
    return action
  }
}
