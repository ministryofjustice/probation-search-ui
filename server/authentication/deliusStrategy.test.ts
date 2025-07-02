import { subHours } from 'date-fns'
import { Request } from 'express'
import crypto from 'crypto'
import { StrategyCreated } from 'passport'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import DeliusStrategy from './deliusStrategy'
import config from '../config'

jest.mock('../data')

describe('DeliusStrategy', () => {
  let deliusStrategy: StrategyCreated<DeliusStrategy>

  beforeEach(() => {
    const strategy = new DeliusStrategy({} as AuthenticationClient)
    deliusStrategy = {
      ...strategy,
      authenticate: strategy.authenticate,
      decrypt: strategy.decrypt,
      success: jest.fn(),
      fail: jest.fn(),
      redirect: jest.fn(),
      pass: jest.fn(),
      error: jest.fn(),
    }
    deliusStrategy.hmppsAuthClient.getToken = jest.fn(() => Promise.resolve('testToken'))
  })

  it('should have the name property set to "delius"', () => {
    expect(deliusStrategy.name).toBe('delius')
  })

  it('should pass if the user is already authenticated', () => {
    const req = { isAuthenticated: () => true } as unknown as Request

    deliusStrategy.authenticate(req)

    expect(deliusStrategy.fail).not.toHaveBeenCalled()
    expect(deliusStrategy.error).not.toHaveBeenCalled()
    expect(deliusStrategy.success).not.toHaveBeenCalled()
    expect(deliusStrategy.pass).toHaveBeenCalled()
  })

  it('should handle authentication based on query parameters', async () => {
    const username = 'testUser'
    const timestamp = Date.now().toString()
    const req = {
      isAuthenticated: () => false,
      query: {
        user: encrypt(username),
        t: encrypt(timestamp),
      },
    } as unknown as Request

    deliusStrategy.authenticate(req)

    await new Promise(process.nextTick)
    expect(deliusStrategy.pass).not.toHaveBeenCalled()
    expect(deliusStrategy.fail).not.toHaveBeenCalled()
    expect(deliusStrategy.error).not.toHaveBeenCalled()
    expect(deliusStrategy.success).toHaveBeenCalledWith({ username, token: 'testToken', authSource: 'delius' })
    expect(deliusStrategy.hmppsAuthClient.getToken).toHaveBeenCalledWith(username)
  })

  it('should handle authentication failure for expired Delius link', async () => {
    const expiredTimestamp = subHours(Date.now(), 2).getDate().toString() // 3 hours ago
    const req = {
      isAuthenticated: () => false,
      query: {
        user: encrypt('testUser'),
        t: encrypt(expiredTimestamp),
      },
    } as unknown as Request

    deliusStrategy.authenticate(req)

    await new Promise(process.nextTick)
    expect(deliusStrategy.error).not.toHaveBeenCalled()
    expect(deliusStrategy.success).not.toHaveBeenCalled()
    expect(deliusStrategy.pass).not.toHaveBeenCalled()
    expect(deliusStrategy.fail).toHaveBeenCalledWith('Expired Delius link')
  })

  it('should handle authentication failure for missing query parameters', () => {
    const req = { isAuthenticated: () => false, query: {} } as unknown as Request

    deliusStrategy.authenticate(req)

    expect(deliusStrategy.error).not.toHaveBeenCalled()
    expect(deliusStrategy.success).not.toHaveBeenCalled()
    expect(deliusStrategy.pass).not.toHaveBeenCalled()
    expect(deliusStrategy.fail).toHaveBeenCalledWith('Missing query parameters user and t')
  })

  it('should handle error calling auth client', async () => {
    const username = 'testUser'
    const timestamp = Date.now().toString()
    const req = {
      isAuthenticated: () => false,
      query: {
        user: encrypt(username),
        t: encrypt(timestamp),
      },
    } as unknown as Request
    deliusStrategy.hmppsAuthClient.getToken = jest.fn(() => Promise.reject(new Error('error')))

    deliusStrategy.authenticate(req)

    await new Promise(process.nextTick)
    expect(deliusStrategy.pass).not.toHaveBeenCalled()
    expect(deliusStrategy.fail).not.toHaveBeenCalled()
    expect(deliusStrategy.success).not.toHaveBeenCalled()
    expect(deliusStrategy.error).toHaveBeenCalledWith(new Error('error'))
  })

  function encrypt(plainText: string): string {
    const key = Buffer.from(crypto.createHash('sha1').update(config.delius.authSecret).digest().subarray(0, 16))
    const cipher = crypto.createCipheriv('aes-128-ecb', key, Buffer.alloc(0))
    return Buffer.concat([cipher.update(plainText, 'utf-8'), cipher.final()]).toString('base64')
  }
})
