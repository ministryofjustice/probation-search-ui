import { Readable } from 'stream'
import { asSystem, RestClient, SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('PrisonApiClient', config.apis.prisonApi, logger, authenticationClient)
  }

  async getImageData(nomsNumber: string): Promise<Readable> {
    try {
      return await this.stream({ path: `/api/bookings/offenderNo/${nomsNumber}/image/data` }, asSystem())
    } catch (error) {
      if (error instanceof SanitisedError && error.responseStatus === 404) return null
      throw error
    }
  }
}
