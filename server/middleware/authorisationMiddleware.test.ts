import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

import authorisationMiddleware from './authorisationMiddleware'

function createToken(authorities: string[], sub: string = 'USER1') {
  const payload = {
    sub,
    user_name: 'USER1',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

describe('authorisationMiddleware', () => {
  let req: Request = {
    path: '/index',
  } as unknown as jest.Mocked<Request>
  const next = jest.fn()

  function createResWithToken({ authorities, sub = 'USER1' }: { authorities: string[]; sub?: string }): Response {
    return {
      locals: {
        user: {
          token: createToken(authorities, sub),
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return next when no required roles', async () => {
    const res = createResWithToken({ authorities: [] })

    await authorisationMiddleware()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when user has no authorised roles', async () => {
    const res = createResWithToken({ authorities: [] })

    await authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })

  it('should return next when user has authorised role', async () => {
    const res = createResWithToken({ authorities: ['SOME_REQUIRED_ROLE'] })

    await authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when trying to access contact search', async () => {
    const res = createResWithToken({ authorities: ['SOME_REQUIRED_ROLE'], sub: 'OTHER_USER' })
    req = {
      path: '/contacts/something',
    } as unknown as jest.Mocked<Request>

    await authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalled()
  })

  it('should return next when trying to access contact search as authorised username', async () => {
    const res = createResWithToken({ authorities: ['SOME_REQUIRED_ROLE'], sub: 'MARCUSASPIN' })
    req = {
      path: '/contacts/something',
    } as unknown as jest.Mocked<Request>

    await authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })
})
