import { Router } from 'express'
import csurf from 'csurf'

const testMode = process.env.NODE_ENV === 'test'

export default function setUpCsrf(): Router {
  const router = Router({ mergeParams: true })

  // CSRF protection
  if (!testMode) {
    router.use((req, res, next) => {
      // CSRF is disabled for the Delius search screen, as we cannot make use of
      // the session cookie while loaded in an iframe (without setting SameSite=None)
      if (req.path.startsWith('/delius/nationalSearch')) next()
      else csurf()(req, res, next)
    })
  }

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
