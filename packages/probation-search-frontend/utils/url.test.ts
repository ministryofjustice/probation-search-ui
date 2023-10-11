import { Request } from 'express'
import { addParameters, getAbsoluteUrl, removeParameters } from './url'

describe('getAbsoluteUrl', () => {
  test.each([
    ['http', 'example.com', '/path', 'http://example.com/path'],
    ['https', 'example.com', '/path', 'https://example.com/path'],
    ['http', 'localhost:3000', '/path?param=value', 'http://localhost:3000/path?param=value'],
  ])('returns the correct absolute URL for %s://%s%s', (protocol, host, originalUrl, expected) => {
    const req = { protocol, originalUrl, get: () => host } as unknown as Request
    expect(getAbsoluteUrl(req)).toBe(expected)
  })
})

describe('addParameters', () => {
  it.each([
    ['https://example.com', { p1: 'value1' }, 'https://example.com/?p1=value1'],
    ['https://example.com/path', { p1: 'value1' }, 'https://example.com/path?p1=value1'],
    ['https://example.com?p1=value1', { p1: 'newValue', p2: 'value2' }, 'https://example.com/?p1=newValue&p2=value2'],
    ['https://example.com?p1=value1', { p1: ['1', '2', '3'] }, 'https://example.com/?p1=1&p1=2&p1=3'],
    ['https://example.com/path?p1=value1', undefined, 'https://example.com/path?p1=value1'],
  ])('should add parameters to the URL', (url, params, expected) => {
    const result = addParameters(url, params)
    expect(result).toBe(expected)
  })
})

describe('removeParameters', () => {
  it.each([
    [
      'https://example.com/?param1=value1&param2=value2&param3=value3',
      ['param1', 'param3'],
      'https://example.com/?param2=value2',
    ],
    ['https://example.com/?param1=value1', [], 'https://example.com/?param1=value1'],
    ['https://example.com/?param1=value1', ['param2'], 'https://example.com/?param1=value1'],
    ['https://example.com/path', ['param1'], 'https://example.com/path'],
    ['https://example.com/path?param1=value', [undefined], 'https://example.com/path?param1=value'],
  ])('should remove specified parameters from the URL (%s)', (url, paramsToRemove: string[], expected) => {
    const result = removeParameters(url, ...paramsToRemove)
    expect(result).toBe(expected)
  })
})
