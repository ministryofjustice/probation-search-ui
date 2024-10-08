/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { format, parseISO } from 'date-fns'
import { highlightText, initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Probation Search'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'preprod' ? 'govuk-tag--green' : ''

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/@ministryofjustice/probation-search-frontend/components', // <-- Enable probation-search-frontend component
    ],
    {
      autoescape: true,
      express: app,
      watch: config.liveReload,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('highlight', highlightText)
  njkEnv.addFilter('formatNumber', (num: number) => num.toLocaleString('en-GB'))
  njkEnv.addFilter('formatDate', (date: string) => format(parseISO(date), 'dd/MM/yyyy'))
  njkEnv.addFilter('indexOfId', (list: { id: number }[], item: { id: number }) => list.map(i => i.id).indexOf(item.id))
}
