import config from '../config'
import RestClient from './restClient'
import logger from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(token: string) {
    super('PrisonApiClient', config.apis.prisonApi, token)
  }

  async getImageUrl(nomsNumber?: string): Promise<string> {
    const placeholder = '/assets/images/NoPhoto@2x.png'
    if (nomsNumber === undefined) return placeholder

    try {
      const imageData = await this.get({
        path: `/api/bookings/offenderNo/${nomsNumber}/image/data`,
        responseType: 'blob',
        handle404: true,
      })
      if (imageData) return `data:image/jpeg;charset=utf-8;base64,${(imageData as Buffer).toString('base64')}`
    } catch (error) {
      logger.error('Unable to fetch prisoner image, fallback to placeholder', error)
    }
    return placeholder
  }
}
