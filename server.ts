// Require app insights before anything else to allow for instrumentation of bunyan and express
import 'applicationinsights'

import * as https from 'https'
import fs from 'fs'
import app from './server/index'
import logger from './logger'
import config from './server/config'

if (config.certificate.key && config.certificate.cert) {
  const key = fs.readFileSync(config.certificate.key, 'utf8')
  const cert = fs.readFileSync(config.certificate.cert, 'utf8')
  const httpsServer = https.createServer({ key, cert }, app)
  httpsServer.listen(app.get('port'), () => {
    logger.info(`Server listening on https://localhost:${app.get('port')}`)
  })
} else {
  app.listen(app.get('port'), () => {
    logger.info(`Server listening on http://localhost:${app.get('port')}`)
  })
}
