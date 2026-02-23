import { RequestHandler, Router } from 'express'
import type { Services } from '../services'
import hmppsAudit from '../utils/hmppsAudit'
import ContactSearchApiClient from '../data/contactSearchClient'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function contactsRoutes(router: Router, services: Services) {
  router.post('/contacts/search', services.contactsCaseSearchService.post)
  router.get('/contacts/search', services.contactsCaseSearchService.get, hmppsAudit, (req, res) => {
    if (req.session.contactSearch) req.session.contactSearch = {}
    res.render('pages/contacts/caseSearch')
  })
  router.post('/contacts/compare', services.contactsCaseComparisonService.post)
  router.get('/contacts/compare', services.contactsCaseComparisonService.get, hmppsAudit, (req, res) => {
    if (req.session.contactSearch) req.session.contactSearch = {}
    res.render('pages/contacts/caseSearch')
  })

  const postQuery: RequestHandler = (req, res, next) => {
    // Add the query to the session
    if (!req.session.contactSearch) {
      req.session.contactSearch = {}
    }
    req.session.contactSearch.sortByDate = req.body.sortByDate ?? 'none'
    req.session.contactSearch.query = req.body['contact-search-input']
    res.redirect(req.url)
  }

  router.post('/contacts/:crn/compare', postQuery)
  router.get(
    '/contacts/:crn/compare',
    asyncMiddleware(async (req, res, next) => {
      const crn = req.params.crn as string
      res.locals.crn = crn
      if (!('contactSearch' in req.session) || !req.session.contactSearch?.query) {
        res.locals.query = ''
        return next()
      }
      const rawQuery = req.session.contactSearch.query
      const queryString = Array.isArray(rawQuery) ? rawQuery[0] : (rawQuery ?? '')
      const client = new ContactSearchApiClient(services.hmppsAuthClient)
      const [resultsA, resultsB] = await Promise.all([
        client.searchContacts(crn, queryString, false),
        client.searchContacts(crn, queryString, true),
      ])
      res.locals.query = queryString
      res.locals.resultsA = resultsA
      res.locals.resultsB = resultsB
      res.locals.deliusUrl = config.delius.url
      return next()
    }),
    (_req, res) => res.render('pages/contacts/compare'),
  )

  router.post('/contacts/:crn/search', postQuery)
  router.get(
    '/contacts/:crn/search',
    asyncMiddleware(async (req, res, next) => {
      const crn = req.params.crn as string
      res.locals.crn = crn
      if (!('contactSearch' in req.session) || !req.session.contactSearch?.query) {
        res.locals.query = ''
        return next()
      }
      const { query, sortByDate } = req.session.contactSearch
      const client = new ContactSearchApiClient(services.hmppsAuthClient)
      res.locals.query = query
      res.locals.sortByDate = sortByDate
      res.locals.results = await client.searchContacts(crn, query, req.query.resultSet === '2', sortString(sortByDate))
      res.locals.deliusUrl = config.delius.url
      return next()
    }),
    (_req, res) => res.render('pages/contacts/search'),
  )

  return router
}

function sortString(sortByDate: 'ascending' | 'descending' | 'none' = 'none'): string {
  if (sortByDate === 'ascending') return 'date,asc'
  if (sortByDate === 'descending') return 'date,desc'
  return 'score,desc'
}
