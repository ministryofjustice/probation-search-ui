import { Router } from 'express'
import type { Services } from '../services'
import hmppsAudit from '../utils/hmppsAudit'
import ContactSearchApiClient from '../data/contactSearchClient'
import config from '../config'

export default function contactsRoutes(router: Router, services: Services) {
  router.post('/contacts', services.contactsCaseSearchService.post)
  router.get('/contacts', services.contactsCaseSearchService.get, hmppsAudit, (_req, res) =>
    res.render('pages/contacts/caseSearch'),
  )

  router.post('/contacts/:crn/compare', (req, res, next) => {
    // Add the query to the session
    if (!req.session.contactSearch) {
      req.session.contactSearch = {}
    }
    req.session.contactSearch.query = req.body['contact-search-input']
    res.redirect(req.url)
  })
  router.get(
    '/contacts/:crn/compare',
    async (req, res, next) => {
      if (!('contactSearch' in req.session) || !req.session.contactSearch || !req.session.contactSearch.query) {
        res.locals.query = ''
        return next()
      }
      const { crn } = req.params
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
    },
    (_req, res) => res.render('pages/contacts/compare'),
  )

  return router
}
