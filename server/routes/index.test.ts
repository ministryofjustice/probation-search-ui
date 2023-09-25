import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import HmppsAuthClient from '../data/hmppsAuthClient'

let app: Express

const services = { hmppsAuthClient: new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient> }

beforeEach(() => {
  app = appWithAllRoutes({ services })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a person on probation')
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
        expect(res.headers.location).toEqual('/delius/nationalSearch?q=Bob')
      })
  })

  it('displays results', () => {
    services.hmppsAuthClient.getSystemClientToken = jest.fn().mockResolvedValue('token')
    return request(app)
      .get('/delius/nationalSearch?q=bloggs')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Showing 1 to 2 of 2 results.')
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
