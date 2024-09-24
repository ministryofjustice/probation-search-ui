import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { dataAccess } from '../data'
import UserService from './userService'
import config from '../config'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, manageUsersApiClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const searchService = new CaseSearchService({
    oauthClient: hmppsAuthClient,
    environment: config.environmentName,
  })

  const contactsCaseSearchService = new CaseSearchService({
    oauthClient: hmppsAuthClient,
    environment: config.environmentName,
    resultPath: crn => `/contacts/${crn}/compare`,
  })

  return {
    applicationInfo,
    hmppsAuthClient,
    userService,
    searchService,
    contactsCaseSearchService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
