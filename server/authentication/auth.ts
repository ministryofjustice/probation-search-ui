import passport from 'passport'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
import type { RequestHandler } from 'express'
import config from '../config'
import generateOauthClientToken from './clientCredentials'
import type { TokenVerifier } from '../data/tokenVerification'
import { HmppsAuthClient } from '../data'
import DeliusStrategy from './deliusStrategy'
import { UserService } from '../services'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

export type AuthenticationMiddleware = (tokenVerifier: TokenVerifier) => RequestHandler

const authenticationMiddleware: AuthenticationMiddleware = verifyToken => {
  return async (req, res, next) => {
    if (req.isAuthenticated() && (await verifyToken(req))) {
      return next()
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  }
}

function init({ hmppsAuthClient, userService }: { hmppsAuthClient: HmppsAuthClient; userService: UserService }): void {
  const oauth2Strategy = new OAuth2Strategy(
    {
      authorizationURL: `${config.apis.hmppsAuth.externalUrl}/oauth/authorize`,
      tokenURL: `${config.apis.hmppsAuth.url}/oauth/token`,
      clientID: config.apis.hmppsAuth.apiClientId,
      clientSecret: config.apis.hmppsAuth.apiClientSecret,
      callbackURL: `${config.domain}/sign-in/callback`,
      state: true,
      customHeaders: { Authorization: generateOauthClientToken() },
    },
    (token, refreshToken, params, profile, done) => {
      const auth = { token, username: params.user_name, authSource: params.auth_source }
      userService
        .getUser(token)
        .then(user => done(null, { ...user, ...auth }))
        .catch(reason => done(reason))
    },
  )

  passport.use('oauth2', oauth2Strategy)
  passport.use('delius', new DeliusStrategy(hmppsAuthClient))
}

export default {
  authenticationMiddleware,
  init,
}
