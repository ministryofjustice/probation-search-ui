import addParameters from './url'

describe('addParameters', () => {
  it.each([
    ['https://example.com', { p1: 'value1' }, 'https://example.com/?p1=value1'],
    ['https://example.com/path', { p1: 'value1' }, 'https://example.com/path?p1=value1'],
    ['https://example.com?p1=value1', { p1: 'newValue', p2: 'value2' }, 'https://example.com/?p1=newValue&p2=value2'],
    ['/path?p1=value1', { p1: 'newValue', p2: 'value2' }, '/path?p1=newValue&p2=value2'],
  ])('should add parameters to the URL', (url, params, expected) => {
    const result = addParameters(url, params)
    expect(result).toBe(expected)
  })
})
