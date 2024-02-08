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
import deliusRoutes from './delius'
import searchRoutes from './search'
import exampleRoutes from './examples'
import caseViewRoutes from './case'

export default function routes(services: Services): Router {
  const router = Router()

  router.get('/info', (req, res) =>
    res.send({
      productId: config.productId,
    }),
  )

  // Home page
  router.get('/', (req, res) => res.redirect('/search'))

  searchRoutes(router, services)
  caseViewRoutes(router, services)
  exampleRoutes(router, services)
  deliusRoutes(router, services)

  return router
}
