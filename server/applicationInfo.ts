import config from './config'

const { buildNumber, gitRef } = config

export type ApplicationInfo = { applicationName: string; buildNumber: string; gitRef: string; gitShortHash: string }

export default (): ApplicationInfo => {
  return {
    applicationName: 'probation-search-ui',
    buildNumber,
    gitRef,
    gitShortHash: gitRef.substring(0, 7),
  }
}
