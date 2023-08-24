import superagent from 'superagent'
import OAuthClient from './oauthClient'
import config, { Environment } from '../config'

export default class ProbationSearchClient {
  constructor(private oauthClient: OAuthClient, private dataSource: Environment | ProbationSearchResult[]) {}

  async search(query: string, asUsername: string = null, page = 1, size = 10): Promise<ProbationSearchResponse> {
    if (this.dataSource instanceof Array) {
      return Promise.resolve(this.localSearch(this.dataSource, page, size))
    }
    const token = await this.oauthClient.getSystemClientToken(asUsername)
    const apiConfig = config[this.dataSource].searchApi
    const response = await superagent
      .post(`${apiConfig.url}/phrase?page=${page - 1}&size=${size}}`)
      .auth(token, { type: 'bearer' })
      .timeout(apiConfig.timeout)
      .retry(2)
      .send({
        phrase: query,
        matchAllTerms: true,
      })
    return response.body
  }

  private localSearch(data: ProbationSearchResult[], page: number, size: number): ProbationSearchResponse {
    const content = data.slice((page - 1) * size, page * size)
    return {
      content,
      size: content.length,
      totalElements: this.dataSource.length,
      totalPages: Math.ceil(this.dataSource.length / size),
    }
  }
}

export interface ProbationSearchResult {
  firstName: string
  middleNames?: string
  surname: string
  dateOfBirth: string
  otherIds: {
    crn: string
  }
}

export interface ProbationSearchResponse {
  content: ProbationSearchResult[]
  size: number
  totalElements: number
  totalPages: number
}
