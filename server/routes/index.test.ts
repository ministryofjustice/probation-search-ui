import type { Express } from 'express'
import request from 'supertest'
import CaseSearchService, {
  CaseSearchOptions,
} from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { appWithAllRoutes, user } from './testutils/appSetup'

const hmppsAuthClient = {} as jest.Mocked<AuthenticationClient>
const searchService = new CaseSearchService({} as CaseSearchOptions) as jest.Mocked<CaseSearchService>
const contactsCaseSearchService = new CaseSearchService({} as CaseSearchOptions) as jest.Mocked<CaseSearchService>
const contactsCaseComparisonService = new CaseSearchService({} as CaseSearchOptions) as jest.Mocked<CaseSearchService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      hmppsAuthClient,
      searchService,
      contactsCaseSearchService,
      contactsCaseComparisonService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /search', () => {
  it('should render search page', () => {
    return request(app)
      .get('/search')
      .expect('Content-Type', /html/)
      .expect(200)
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
    hmppsAuthClient.getToken = jest.fn().mockResolvedValue('token')
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
