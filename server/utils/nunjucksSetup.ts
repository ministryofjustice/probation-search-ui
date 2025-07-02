/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { format, parseISO } from 'date-fns'
import fs from 'fs'
import { highlightText, initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Probation Search'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'preprod' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/probation-search-frontend/components', // <-- Enable probation-search-frontend component
    ],
    {
      autoescape: true,
      express: app,
      watch: config.liveReload,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('highlight', highlightText)
  njkEnv.addFilter('formatNumber', (num: number) => num.toLocaleString('en-GB'))
  njkEnv.addFilter('formatDate', (date: string) => format(parseISO(date), 'dd/MM/yyyy'))
  njkEnv.addFilter('indexOfId', (list: { id: number }[], item: { id: number }) => list.map(i => i.id).indexOf(item.id))
}
