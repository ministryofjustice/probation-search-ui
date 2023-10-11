import { Request } from 'express'
import SearchParameters from './searchParameters'

describe('SearchParameters', () => {
  let req: Request
  let session: {
    probationSearch?: ProbationSearch.SearchParameters
  }

  beforeEach(() => {
    session = {}
    req = {
      protocol: 'https',
      get: () => 'localhost',
      originalUrl: '/path',
      session,
    } as unknown as Request
  })

  it('should load parameters from the session', () => {
    session.probationSearch = {
      q: 'value1',
      providers: ['value2', 'value3'],
    }
    const params = SearchParameters.loadFromSession(req)
    expect(params).toBe('https://localhost/path?q=value1&providers=value2&providers=value3')
  })

  it('should save parameters to the session', () => {
    req.query = {
      q: 'value1',
      providers: ['value2', 'value3'],
    }
    SearchParameters.saveToSession(req)
    expect(session.probationSearch).toEqual({
      q: 'value1',
      providers: ['value2', 'value3'],
    })
  })

  it('should check if parameters are in the session', () => {
    expect(SearchParameters.inSession(req)).toBe(false)

    req.query = {
      param1: 'value1',
      param2: ['value2', 'value3'],
    }
    SearchParameters.saveToSession(req)

    expect(SearchParameters.inSession(req)).toBe(true)
  })
})
