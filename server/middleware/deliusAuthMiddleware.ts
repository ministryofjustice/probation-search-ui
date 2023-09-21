import type { RequestHandler } from 'express'
import * as crypto from 'crypto'
import { addHours } from 'date-fns'
import asyncMiddleware from './asyncMiddleware'
import { HmppsAuthClient } from '../data'
import logger from '../../logger'
import config from '../config'

export default function deliusAuthMiddleware(hmppsAuthClient: HmppsAuthClient): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    if (req.path.startsWith('/delius') && req.query.user && req.query.t) {
      // We've been loaded in the Delius iframe, get a client token using the Delius user token
      const username = decrypt(req.query.user as string)
      const expiry = addHours(new Date(+decrypt(req.query.t as string)), 2)
      if (Date.now() > expiry.getTime()) {
        logger.error(`Attempt to use expired Delius link. Expired at ${expiry.toLocaleString()}.`)
        return res.redirect('/authError')
      }
      const token = await hmppsAuthClient.getSystemClientToken(username)
      req.user = { username, token, authSource: 'delius' }
      logger.debug('Swapped Delius user token for HMPPS Auth token')
    }

    return next()
  })

  function decrypt(encrypted: string): string {
    const key = Buffer.from(crypto.createHash('sha1').update(config.delius.authSecret).digest().subarray(0, 16))
    const decipher = crypto.createDecipheriv('aes-128-ecb', key, Buffer.alloc(0))
    return decipher.update(encrypted, 'base64', 'utf-8') + decipher.final('utf-8')
  }
}
