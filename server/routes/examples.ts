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

export default function exampleRoutes(router: Router, services: Services) {
  router.post('/examples', services.searchService.post)
  router.get('/examples', services.searchService.get, (req, res) => res.render('pages/examples'))
}
