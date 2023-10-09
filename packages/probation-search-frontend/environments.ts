export type Environment = 'local' | 'dev' | 'preprod' | 'prod'
export interface ApiConfig {
  url: string
  timeout: number
}
export type EnvironmentConfig = {
  searchApi: ApiConfig
}

const environments: { [key in Environment]: EnvironmentConfig } = {
  local: null,
  dev: {
    searchApi: { url: 'https://probation-offender-search-dev.hmpps.service.justice.gov.uk', timeout: 5000 },
  },
  preprod: {
    searchApi: { url: 'https://probation-offender-search-preprod.hmpps.service.justice.gov.uk', timeout: 5000 },
  },
  prod: {
    searchApi: { url: 'https://probation-offender-search.hmpps.service.justice.gov.uk', timeout: 5000 },
  },
}

export default environments
