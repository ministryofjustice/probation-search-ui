import { Environment } from '@ministryofjustice/probation-search-frontend/environments'

const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  environment: customApiUrl() ?? (get('ENVIRONMENT', 'local', requiredInProduction) as Environment),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  staticResourceCacheDuration: '1h',
  liveReload: get('LIVE_RELOAD', 'false') === 'true',
  redis: {
    enabled: get('REDIS_ENABLED', 'true') === 'true',
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    loaderScriptId: process.env.SENTRY_LOADER_SCRIPT_ID,
    environment: get('ENVIRONMENT', 'local', requiredInProduction),
    tracesSampleRate: Number(get('SENTRY_TRACES_SAMPLE_RATE', 0.05)),
    replaySampleRate: Number(get('SENTRY_REPLAY_SAMPLE_RATE', 0.0)),
  },
  delius: {
    url: get('DELIUS_URL', '*', requiredInProduction),
    authSecret: get('DELIUS_AUTH_SECRET', 'secret', requiredInProduction),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://localhost:9091/prison-api', requiredInProduction),
      timeout: {
        response: Number(get('PRISON_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('PRISON_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('PRISON_API_TIMEOUT_RESPONSE', 5000))),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  https: new URL(get('INGRESS_URL', 'http://localhost:3000', requiredInProduction)).protocol === 'https:',
  certificate: {
    key: process.env.HTTPS_KEY,
    cert: process.env.HTTPS_CERT,
  },
  signing: {
    secret: get('SIGNING_SECRET', 'signing-secret', requiredInProduction),
    algorithm: get('SIGNING_ALGORITHM', 'sha256'),
  },
}

function customApiUrl() {
  return process.env.API_URL
    ? {
        searchApi: {
          url: process.env.API_URL,
          timeout: +get('API_TIMEOUT', 5000),
        },
      }
    : null
}
