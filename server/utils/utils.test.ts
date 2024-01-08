import { createHmac } from 'crypto'
import { Request } from 'express'
import { addSeconds, subSeconds } from 'date-fns'
import { convertToTitleCase, highlightText, initialiseName, signUrl, verifySignedUrl } from './utils'
import config from '../config'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('highlightText', () => {
  it.each([
    [undefined, undefined, undefined],
    [undefined, 'undefined', undefined],
    ['Hello world', undefined, 'Hello world'],
    ['Hello world', 'world', 'Hello <span class="highlighted-text">world</span>'],
    ['Hello world', 'hello', '<span class="highlighted-text">Hello</span> world'],
    [
      'Hello world',
      'hello world',
      '<span class="highlighted-text">Hello</span> <span class="highlighted-text">world</span>',
    ],
    ['Hello world)', 'world)', 'Hello <span class="highlighted-text">world)</span>'],
  ])('should highlight text correctly', (textToHighlight, query, expected) => {
    expect(highlightText(textToHighlight, query, true)).toEqual(expected)
  })
})

describe('signUrl', () => {
  it('should add signature and expiry to URL', () => {
    const path = '/example/path'
    const expectedExpiry = addSeconds(new Date(), 600)
    const expectedSignature = createHmac(config.signing.algorithm, config.signing.secret)
      .update(`${path};${expectedExpiry.getTime()}`)
      .digest('hex')

    const signedUrl = signUrl(path, expectedExpiry)
    const signature = signedUrl.match(/signature=([^&]*)/)?.[1]
    const expiry = signedUrl.match(/expiry=([^&]*)/)?.[1]

    expect(expiry).toBe(expectedExpiry.getTime().toString())
    expect(signature).toBe(expectedSignature)
  })
})

describe('verifySignedUrl', () => {
  it('should return true for a valid signed URL', () => {
    const signedUrl = new URL(signUrl('/example/path'), 'http://localhost')

    const request = {
      path: signedUrl.pathname,
      query: {
        signature: signedUrl.searchParams.get('signature'),
        expiry: signedUrl.searchParams.get('expiry'),
      },
    } as unknown as Request

    expect(verifySignedUrl(request)).toBe(true)
  })

  it('should return false if the signature is invalid', () => {
    const signedUrl = new URL(signUrl('/example/path'), 'http://localhost')

    const request = {
      path: signedUrl.pathname,
      query: {
        signature: 'invalid-signature',
        expiry: signedUrl.searchParams.get('expiry'),
      },
    } as unknown as Request

    expect(verifySignedUrl(request)).toBe(false)
  })

  it('should return false if the expiry has passed', () => {
    const signedUrl = new URL(signUrl('/example/path', subSeconds(new Date(), 1)), 'http://localhost')

    const request = {
      path: signedUrl.pathname,
      query: {
        signature: signedUrl.searchParams.get('signature'),
        expiry: signedUrl.searchParams.get('expiry'),
      },
    } as unknown as Request

    expect(verifySignedUrl(request)).toBe(false)
  })
})
