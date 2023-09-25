import nock, { Scope } from 'nock'

import config from '../config'
import PrisonApiClient from './prisonApiClient'

jest.mock('./tokenStore/redisTokenStore')

describe('prisonApiClient', () => {
  let http: Scope
  let prisonApiClient: PrisonApiClient

  beforeEach(() => {
    http = nock(config.apis.prisonApi.url)
    prisonApiClient = new PrisonApiClient('token')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getImageUrl', () => {
    it('should return a base64 data url', async () => {
      http.get('/api/bookings/offenderNo/TEST/image/data').reply(200, Buffer.from([1, 2, 3]))
      const output = await prisonApiClient.getImageUrl('TEST')
      expect(output).toEqual('data:image/jpeg;charset=utf-8;base64,AQID')
    })

    it('should return a placeholder when no noms number is provided', async () => {
      const output = await prisonApiClient.getImageUrl()
      expect(output).toEqual('/assets/images/NoPhoto@2x.png')
    })

    it('should return a placeholder when no image is available', async () => {
      http.get('/api/bookings/offenderNo/TEST/image/data').reply(404)
      const output = await prisonApiClient.getImageUrl()
      expect(output).toEqual('/assets/images/NoPhoto@2x.png')
    })
  })
})
