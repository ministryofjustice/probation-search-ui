import * as Sentry from '@sentry/node'
import { Express } from 'express'
import config from '../config'

export default function initSentry(app: Express): void {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.environment,
      integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.Express({ app })],
      tracesSampleRate: config.sentry.tracesSampleRate ? +config.sentry.tracesSampleRate : 1.0,
    })
    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
  }
}
