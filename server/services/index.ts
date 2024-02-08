import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { ProbationSearchResult } from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { dataAccess } from '../data'
import UserService from './userService'
import config from '../config'

export const services = () => {
  const { hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)
  const searchService = new CaseSearchService({
    oauthClient: hmppsAuthClient,
    environment: config.environment,
  })

  return {
    applicationInfo,
    hmppsAuthClient,
    userService,
    searchService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
