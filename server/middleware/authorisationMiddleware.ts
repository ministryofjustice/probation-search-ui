import { jwtDecode } from 'jwt-decode'
import type { RequestHandler } from 'express'

import logger from '../../logger'
import asyncMiddleware from './asyncMiddleware'

const authorisedContactSearchUsers = [
  'ZOEWALKERNPS',
  'JOEPRINOLD1HMPPS',
  'JOE.PRINOLD',
  'MARCUSASPIN',
  'AOJ19Y',
  'ANDREWLOGANMOJ',
]

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return asyncMiddleware((req, res, next) => {
    if (res.locals?.user?.token) {
      const { authorities: roles = [], sub } = jwtDecode(res.locals.user.token) as {
        authorities?: string[]
        sub?: string
      }

      if (authorisedRoles.length && !roles.some(role => authorisedRoles.includes(role))) {
        logger.error('User is not authorised to access this')
        return res.redirect('/authError')
      }

      if (req.path.includes('/contacts/') && sub && !authorisedContactSearchUsers.includes(sub.toUpperCase())) {
        logger.error(`User '${sub}' is not authorised to access contact search`)
        return res.redirect('/authError')
      }

      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  })
}
