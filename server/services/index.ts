import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { dataAccess } from '../data'
import UserService from './userService'
import config from '../config'

export const services = () => {
  const { applicationInfo, manageUsersApiClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
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
