import * as Sentry from '@sentry/node'
import { Express } from 'express'
import config from '../config'

export default function initSentry(app: Express): void {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      tracesSampleRate: config.sentry.tracesSampleRate,
    })

    app.use((req, res, next) => {
      res.locals.sentry = config.sentry
      return next()
    })
  }
}
