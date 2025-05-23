import type { Router } from 'express'
import express from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import { removeParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import * as Sentry from '@sentry/node'
import config from '../config'
import auth from '../authentication/auth'
import { Services } from '../services'

const router = express.Router()

export default function setUpAuth(services: Services): Router {
  auth.init(services)

  router.use(passport.initialize())
  router.use(passport.session())
  router.use(flash())

  router.get('/autherror', (req, res) => {
    res.status(401)
    return res.render('autherror')
  })

  router.get('/delius/*splat', passport.authenticate('delius'))
  router.get('/delius/*splat', (req, res, next) => {
    // If Delius authentication was successful, we can remove the request parameters
    if (req.query.user && req.query.t && req.isAuthenticated()) return res.redirect(removeParameters(req, 'user', 't'))
    return next()
  })

  router.get('/sign-in', passport.authenticate('oauth2'))

  router.get('/sign-in/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/',
      failureRedirect: '/autherror',
    })(req, res, next),
  )

  const authUrl = config.apis.hmppsAuth.externalUrl
  const authSignOutUrl = `${authUrl}/sign-out?client_id=${config.apis.hmppsAuth.apiClientId}&redirect_uri=${config.domain}`

  router.use('/sign-out', (req, res, next) => {
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authSignOutUrl))
      })
    } else res.redirect(authSignOutUrl)
  })

  router.use('/account-details', (req, res) => {
    res.redirect(`${authUrl}/account-details`)
  })

  router.use((req, res, next) => {
    if (req.isAuthenticated()) Sentry.setUser({ username: req.user.username })
    res.locals.user = req.user
    next()
  })

  return router
}
