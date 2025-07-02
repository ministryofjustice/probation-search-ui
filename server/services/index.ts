import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { dataAccess } from '../data'
import config from '../config'

export const services = () => {
  const { applicationInfo, hmppsAuthClient } = dataAccess()

  const searchService = new CaseSearchService({
    hmppsAuthClient,
    environment: config.environmentName,
  })

  const contactsCaseSearchService = new CaseSearchService({
    hmppsAuthClient,
    environment: config.environmentName,
    resultPath: crn => `/contacts/${crn}/search?resultSet=2`,
  })

  const contactsCaseComparisonService = new CaseSearchService({
    hmppsAuthClient,
    environment: config.environmentName,
    resultPath: crn => `/contacts/${crn}/compare`,
  })

  return {
    applicationInfo,
    hmppsAuthClient,
    searchService,
    contactsCaseSearchService,
    contactsCaseComparisonService,
  }
}

export type Services = ReturnType<typeof services>
