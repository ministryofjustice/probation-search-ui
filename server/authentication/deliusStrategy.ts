import { Strategy, StrategyCreated } from 'passport'
import { addHours } from 'date-fns'
import { Request } from 'express'
import crypto from 'crypto'
import { HmppsAuthClient } from '../data'
import logger from '../../logger'
import config from '../config'

export default class DeliusStrategy extends Strategy {
  name = 'delius'

  constructor(public readonly hmppsAuthClient: HmppsAuthClient) {
    super()
  }

  authenticate(this: StrategyCreated<this>, req: Request): Promise<void> | void {
    if (req.isAuthenticated()) {
      this.pass()
    } else if (!req.query.user || !req.query.t) {
      this.fail('Missing query parameters user and t')
    } else {
      const username = this.decrypt(req.query.user as string)
      const expiry = addHours(new Date(+this.decrypt(req.query.t as string)), 2)
      if (Date.now() > expiry.getTime()) {
        logger.error(`Attempt to use expired Delius link. Expired at ${expiry.toLocaleString()}.`)
        this.fail('Expired Delius link')
      } else {
        this.hmppsAuthClient
          .getSystemClientToken(username)
          .then(token => {
            logger.debug('Swapped Delius user token for HMPPS Auth token')
            this.success({ token, username, authSource: 'delius' })
          })
          .catch(reason => this.error(reason))
      }
    }
  }

  decrypt(encrypted: string): string {
    const key = Buffer.from(crypto.createHash('sha1').update(config.delius.authSecret).digest().subarray(0, 16))
    const decipher = crypto.createDecipheriv('aes-128-ecb', key, Buffer.alloc(0))
    return decipher.update(encrypted, 'base64', 'utf-8') + decipher.final('utf-8')
  }
}
