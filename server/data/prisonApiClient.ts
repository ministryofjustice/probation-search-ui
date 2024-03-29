import { Readable } from 'stream'
import config from '../config'
import RestClient from './restClient'

export default class PrisonApiClient extends RestClient {
  constructor(token: string) {
    super('PrisonApiClient', config.apis.prisonApi, token)
  }

  getImageData(nomsNumber: string): Promise<Readable> {
    return this.stream({
      path: `/api/bookings/offenderNo/${nomsNumber}/image/data`,
      handle404: true,
    })
  }
}
