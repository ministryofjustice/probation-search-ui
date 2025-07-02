import * as Sentry from '@sentry/node'
import config from '../config'

export default function initSentry(): void {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      tracesSampleRate: config.sentry.tracesSampleRate,
    })
  }
}
