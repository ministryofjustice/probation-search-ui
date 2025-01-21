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
    req.session.contactSearch.query = req.body['contact-search-input']
    res.redirect(req.url)
  }

  router.post('/contacts/:crn/compare', postQuery)
  router.get(
    '/contacts/:crn/compare',
    asyncMiddleware(async (req, res, next) => {
      const { crn } = req.params
      res.locals.crn = crn
      if (!('contactSearch' in req.session) || !req.session.contactSearch?.query) {
        res.locals.query = ''
        return next()
      }
      const { query } = req.session.contactSearch
      const token = await services.hmppsAuthClient.getSystemClientToken()
      const client = new ContactSearchApiClient(token)
      const [resultsA, resultsB] = await Promise.all([
        client.searchContacts(crn, query, false),
        client.searchContacts(crn, query, true),
      ])
      res.locals.query = query
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
      const { crn } = req.params
      res.locals.crn = crn
      if (!('contactSearch' in req.session) || !req.session.contactSearch?.query) {
        res.locals.query = ''
        return next()
      }
      const { query } = req.session.contactSearch
      const token = await services.hmppsAuthClient.getSystemClientToken()
      const client = new ContactSearchApiClient(token)
      res.locals.query = query
      res.locals.results = await client.searchContacts(crn, query, req.query.resultSet === '2')
      res.locals.deliusUrl = config.delius.url
      return next()
    }),
    (_req, res) => res.render('pages/contacts/search'),
  )

  return router
}
