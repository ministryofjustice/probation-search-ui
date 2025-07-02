import { Router } from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
import { AuthenticatedRequest, AuthenticationClient, VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import { removeParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import * as Sentry from '@sentry/node'
import config from '../config'
import { HmppsUser } from '../interfaces/hmppsUser'
import generateOauthClientToken from '../utils/clientCredentials'
import logger from '../../logger'
import DeliusStrategy from '../authentication/deliusStrategy'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

const oauth2Strategy = new OAuth2Strategy(
  {
    authorizationURL: `${config.apis.hmppsAuth.externalUrl}/oauth/authorize`,
    tokenURL: `${config.apis.hmppsAuth.url}/oauth/token`,
    clientID: config.apis.hmppsAuth.authClientId,
    clientSecret: config.apis.hmppsAuth.authClientSecret,
    callbackURL: `${config.ingressUrl}/sign-in/callback`,
    state: true,
    customHeaders: { Authorization: generateOauthClientToken() },
  },
  (token, refreshToken, params, profile, done) => {
    return done(null, { token, username: params.user_name, authSource: params.auth_source })
  },
)

export default function setupAuthentication(authenticationClient: AuthenticationClient) {
  const router = Router()
  const tokenVerificationClient = new VerificationClient(config.apis.tokenVerification, logger)

  passport.use('oauth2', oauth2Strategy)
  passport.use('delius', new DeliusStrategy(authenticationClient))

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
  const authParameters = `client_id=${config.apis.hmppsAuth.authClientId}&redirect_uri=${config.ingressUrl}`

  router.use('/sign-out', (req, res, next) => {
    const authSignOutUrl = `${authUrl}/sign-out?${authParameters}`
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authSignOutUrl))
      })
    } else res.redirect(authSignOutUrl)
  })

  router.use('/account-details', (req, res) => {
    res.redirect(`${authUrl}/account-details?${authParameters}`)
  })

  router.use(async (req, res, next) => {
    if (
      req.isAuthenticated() &&
      (req.path?.startsWith('/delius') ||
        (await tokenVerificationClient.verifyToken(req as unknown as AuthenticatedRequest)))
    ) {
      return next()
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  })

  router.use((req, res, next) => {
    if (req.isAuthenticated()) Sentry.setUser({ username: req.user.username })
    res.locals.user = req.user as HmppsUser
    next()
  })

  return router
}
