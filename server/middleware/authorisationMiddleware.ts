import { jwtDecode } from 'jwt-decode'
import type { RequestHandler } from 'express'

import logger from '../../logger'

const authorisedContactSearchUsers = [
  'ZOEWALKERNPS',
  'JOEPRINOLD1HMPPS',
  'JOE.PRINOLD',
  'MARCUSASPIN',
  'AOJ19Y',
  'ANDREWLOGANMOJ',
]

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    // authorities in the user token will always be prefixed by ROLE_.
    // Convert roles that are passed into this function without the prefix so that we match correctly.
    const authorisedAuthorities = authorisedRoles.map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`))
    if (res.locals?.user?.token) {
      const { authorities: roles = [], sub } = jwtDecode(res.locals.user.token) as {
        authorities?: string[]
        sub?: string
      }

      if (authorisedAuthorities.length && !roles.some(role => authorisedAuthorities.includes(role))) {
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
  }
}
