import environments from '@ministryofjustice/probation-search-frontend/environments'
import { AgentConfig, asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

interface Page<T> {
  results: T[]
  size: number
  page: number
  totalResults: number
  totalPages: number
}

interface Contact {
  crn: string
  id: number
  typeCode: string
  typeDescription: string
  outcomeCode: string
  outcomeDescription: string
  notes: string
  date: string
  startTime: string
  lastUpdatedDateTime: string
  score: number
}

export default class ContactSearchApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super(
      'ContactSearchApiClient',
      {
        url:
          config.environmentName === 'local'
            ? process.env.CONTACT_SEARCH_URL
            : environments[config.environmentName].searchApi.url,
        timeout: { response: 30000, deadline: 30000 },
        agent: new AgentConfig(30000),
      },
      logger,
      authenticationClient,
    )
  }

  async searchContacts(
    crn: string,
    query: string,
    semantic: boolean,
    sort: string = 'score,desc',
    size: number = 1000,
  ): Promise<Page<Contact> & { timeTaken: string }> {
    const start = performance.now()
    const response = (await this.post(
      {
        path: `/search/contacts?semantic=${semantic}&size=${size}&sort=${sort}`,
        data: {
          crn,
          query,
          matchAllTerms: false,
          includeScores: true,
        },
      },
      asSystem(),
    )) as Page<Contact>

    const timeTaken = `${((performance.now() - start) / 1000).toFixed(3)} seconds`

    return { ...response, timeTaken }
  }
}
