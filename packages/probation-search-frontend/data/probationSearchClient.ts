import superagent from 'superagent'
import OAuthClient from './oauthClient'
import environments, { EnvironmentConfig } from '../environments'

export default class ProbationSearchClient {
  constructor(
    private oauthClient: OAuthClient,
    private dataSource: 'dev' | 'preprod' | 'prod' | EnvironmentConfig | ProbationSearchResult[],
  ) {}

  async search({
    query,
    matchAllTerms = true,
    providersFilter = [],
    asUsername,
    pageNumber = 1,
    pageSize = 10,
  }: ProbationSearchRequest): Promise<ProbationSearchResponse> {
    if (this.dataSource instanceof Array) {
      return Promise.resolve(this.localSearch(this.dataSource, pageNumber, pageSize))
    }
    const token = await this.oauthClient.getSystemClientToken(asUsername)
    const apiConfig = this.getApiConfig(this.dataSource).searchApi
    const response = await superagent
      .post(`${apiConfig.url}/phrase?page=${pageNumber - 1}&size=${pageSize}}`)
      .auth(token, { type: 'bearer' })
      .timeout(apiConfig.timeout)
      .retry(2)
      .send({
        phrase: query,
        probationAreasFilter: providersFilter,
        matchAllTerms,
      })
    return response.body
  }

  private localSearch(data: ProbationSearchResult[], page: number, size: number): ProbationSearchResponse {
    const content = data.slice((page - 1) * size, page * size)
    return {
      content,
      probationAreaAggregations: [],
      size: content.length,
      totalElements: data.length,
      totalPages: Math.ceil(data.length / size),
    }
  }

  private getApiConfig(dataSource: 'dev' | 'preprod' | 'prod' | EnvironmentConfig): EnvironmentConfig {
    if (dataSource === 'dev' || dataSource === 'preprod' || dataSource === 'prod') return environments[dataSource]
    return dataSource
  }
}

export interface ProbationSearchRequest {
  query: string
  matchAllTerms: boolean
  providersFilter: string[]
  asUsername: string
  pageNumber: number
  pageSize: number
}

export interface ProbationSearchResponse {
  content: ProbationSearchResult[]
  suggestions?: {
    suggest?: { [key: string]: Suggestion[] }
  }
  probationAreaAggregations: {
    code: string
    description: string
    count: number
  }[]
  size: number
  totalElements: number
  totalPages: number
}

export interface ProbationSearchResult {
  offenderId: number
  otherIds: {
    crn: string
    nomsNumber?: string
  }
  firstName: string
  middleNames?: string[]
  surname: string
  dateOfBirth: string
  age: number
  gender: string
  currentDisposal?: string
  offenderProfile?: {
    riskColour?: string
  }
  offenderManagers?: {
    active: boolean
    probationArea: {
      code: string
      description: string
    }
    staff: {
      forenames: string
      surname: string
    }
  }[]
  offenderAliases?: {
    dataOfBirth: string
    firstName: string
    middleNames: string[]
    surname: string
    gender: string
  }[]
  previousSurname?: string
  accessDenied?: boolean
  highlight: { [key: string]: string[] }
}

export interface Suggestion {
  text: string
  offset: number
  length: number
  options: {
    text: string
    freq: number
    score: number
  }[]
}
