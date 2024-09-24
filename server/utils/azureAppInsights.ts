import {
  defaultClient,
  DistributedTracingModes,
  getCorrelationContext,
  setup,
  TelemetryClient,
} from 'applicationinsights'
import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { Request, RequestHandler } from 'express'
import type { ApplicationInfo } from '../applicationInfo'

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function appInsightsMiddleware(): RequestHandler {
  return (req, res, next) => {
    res.prependOnceListener('finish', () => {
      const context = getCorrelationContext()
      if (context && req.route) {
        context.customProperties.setProperty('operationName', `${req.method} ${req.route?.path}`)
      }
    })
    next()
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
    defaultClient.addTelemetryProcessor(({ tags, data }, contextObjects) => {
      const operationNameOverride = contextObjects.correlationContext?.customProperties?.getProperty('operationName')
      if (operationNameOverride) {
        tags['ai.operation.name'] = data.baseData.name = operationNameOverride // eslint-disable-line no-param-reassign,no-multi-assign
      }
      return true
    })
    return defaultClient
  }
  return null
}

export default class ApplicationInsightsEvents {
  static searchPerformed(request: ProbationSearchRequest, response: ProbationSearchResponse, username: string) {
    defaultClient?.trackEvent({
      name: 'SearchPerformed',
      properties: {
        query: {
          length: request.query.length,
          tokens: request.query.trim().split(/\s+/).length,
        },
        matchAllTerms: request.matchAllTerms,
        providersFilter: request.providersFilter,
        pageNumber: request.pageNumber,
        asUsername: username,
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
        query: {
          length: req.session.probationSearch?.query?.length,
          tokens: req.session.probationSearch?.query?.trim().split(/\s+/).length,
        },
        matchAllTerms: req.session.probationSearch?.matchAllTerms,
        providersFilter: req.session.probationSearch?.providers,
        asUsername: req.user.username,
        pageNumber: req.session.probationSearch?.page,
        selectedResult: req.body.index,
        selectedCrn: req.body.crn,
      },
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
