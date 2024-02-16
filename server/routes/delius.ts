import { Router } from 'express'
import {
  ProbationSearchRequest,
  ProbationSearchResponse,
} from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { format, parseISO } from 'date-fns'
import { Readable } from 'stream'
import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import config from '../config'
import type { Services } from '../services'
import PrisonApiClient from '../data/prisonApiClient'
import ApplicationInsightsEvents from '../utils/azureAppInsights'
import { signUrl, verifySignedUrl } from '../utils/utils'
import hmppsAudit from '../utils/hmppsAudit'

export default function deliusRoutes(router: Router, services: Services) {
  const deliusSearch = new CaseSearchService({
    oauthClient: services.hmppsAuthClient,
    environment: config.environment,
    allowEmptyQuery: true,
  })
  router.post('/delius/nationalSearch', deliusSearch.post)
  router.get('/delius/nationalSearch', deliusSearch.get, hmppsAudit, (req, res) =>
    res.render('pages/deliusSearch/index', {
      deliusUrl: config.delius.url,
      sentry: config.sentry,
      ...(res.locals.searchResponse
        ? mapResults(res.locals.searchResponse, res.locals.searchRequest, req.user.username)
        : {}),
    }),
  )

  router.post('/delius/nationalSearch/filters', (req, res) => {
    if (!req.session.probationSearch) req.session.probationSearch = {}
    const session = req.session.probationSearch
    session.matchAllTerms = req.body.matchAllTerms
    session.providers = req.body.providers
    return res.sendStatus(200)
  })

  router.get('/delius/nationalSearch/prisoner-image/:prisonerId', async (req, res) => {
    if (!verifySignedUrl(req)) {
      res.sendStatus(403)
    } else {
      let data: Readable
      if (req.params.prisonerId) {
        const token = await services.hmppsAuthClient.getSystemClientToken()
        data = await new PrisonApiClient(token).getImageData(req.params.prisonerId)
      }
      if (data) {
        res.set('Cache-Control', 'private, max-age=86400')
        res.removeHeader('pragma')
        res.type('image/jpeg')
        data.pipe(res)
      } else {
        res.redirect('/assets/images/NoPhoto@2x.png')
      }
    }
  })

  router.get('/delius/nationalSearch/help', (req, res) => res.render('pages/deliusSearch/help'))

  router.post('/delius/nationalSearch/trackEvent', (req, res) => {
    ApplicationInsightsEvents.trackEvent(req)
    return res.sendStatus(200)
  })
}

function mapResults(response: ProbationSearchResponse, request: ProbationSearchRequest, username: string) {
  ApplicationInsightsEvents.searchPerformed(request, response, username)
  const returnedProviders = response.probationAreaAggregations.map(p => ({
    value: `${p.code}-${p.description}`,
    text: `${p.description} (${p.count})`,
    checked: request.providersFilter.includes(`${p.code}-${p.description}`),
  }))
  const selectedProviders = request.providersFilter
    .filter(p => !returnedProviders.find(r => r.value === p))
    .map(p => ({
      value: p,
      text: `${p.substring(4)} (0)`,
      checked: true,
    }))
  return {
    results: response.content.map(result => {
      const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
      return {
        ...result,
        formattedDateOfBirth: result.dateOfBirth ? format(parseISO(result.dateOfBirth), 'dd/MM/yyyy') : '',
        imageUrl: result.otherIds.nomsNumber
          ? signUrl(`/delius/nationalSearch/prisoner-image/${result.otherIds.nomsNumber}`)
          : '/assets/images/NoPhoto@2x.png',
        officer: `${activeManager?.staff?.surname}, ${activeManager?.staff?.forenames}`,
        provider: activeManager?.probationArea?.description,
      }
    }),
    query: request.query,
    providers: [...selectedProviders, ...returnedProviders].sort(
      (a, b) => +b.checked - +a.checked || a.text?.localeCompare(b.text),
    ),
    matchAllTerms: request.matchAllTerms,
    deliusUrl: config.delius.url,
  }
}
