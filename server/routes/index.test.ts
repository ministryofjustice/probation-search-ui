import type { Express } from 'express'
import request from 'supertest'
import CaseSearchService, {
  CaseSearchOptions,
} from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { appWithAllRoutes } from './testutils/appSetup'
import HmppsAuthClient from '../data/hmppsAuthClient'

let app: Express

const services = {
  searchService: new CaseSearchService({} as CaseSearchOptions) as jest.Mocked<CaseSearchService>,
  deliusSearchService: new CaseSearchService({} as CaseSearchOptions) as jest.Mocked<CaseSearchService>,
  hmppsAuthClient: new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>,
}

beforeEach(() => {
  app = appWithAllRoutes({ services })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /search', () => {
  it('should render search page', () => {
    return request(app)
      .get('/search')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Find a person on probation')
      })
  })
})

describe('GET /delius/nationalSearch', () => {
  it('should render delius search page', () => {
    return request(app)
      .get('/delius/nationalSearch')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for people on probation')
      })
  })

  it('should accept search params and redirect', () => {
    return request(app)
      .post('/delius/nationalSearch')
      .send({ 'probation-search-input': 'Bob' })
      .expect(res => {
        expect(res.redirect).toEqual(true)
        expect(res.headers.location).toContain('/delius/nationalSearch')
      })
  })

  it('displays results', async () => {
    services.hmppsAuthClient.getSystemClientToken = jest.fn().mockResolvedValue('token')
    let cookies: string[]
    await request(app)
      .post('/delius/nationalSearch')
      .send({ 'probation-search-input': 'Bob' })
      .expect(res => {
        cookies = res.get('Set-Cookie').map(cookie => cookie.split(';')[0])
      })
    return request(app)
      .get('/delius/nationalSearch')
      .set('Cookie', cookies)
      .expect('Content-Type', /html/)
      .expect(getResponse => {
        expect(getResponse.text).toContain('Showing 1 to 2 of 2 results.')
      })
  })
})

describe('GET /info', () => {
  it('should render info endpoint information', () => {
    return request(app)
      .get('/info')
      .expect('Content-Type', /application\/json/)
      .expect(res => {
        expect(res.text).toContain('productId')
      })
  })
})
