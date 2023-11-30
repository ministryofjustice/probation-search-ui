import { convertToTitleCase, highlightText, initialiseName } from './utils'

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
    [undefined, undefined, ''],
    [undefined, ['undefined'], ''],
    ['Hello world', undefined, 'Hello world'],
    ['Hello world', ['world'], 'Hello <span class="highlighted-text">world</span>'],
    ['Hello world', ['hello'], '<span class="highlighted-text">Hello</span> world'],
    [
      'Hello world',
      ['hello', 'world'],
      '<span class="highlighted-text">Hello</span> <span class="highlighted-text">world</span>',
    ],
    ['Hello world)', ['world)'], 'Hello <span class="highlighted-text">world)</span>'],
  ])('should highlight text correctly', (textToHighlight, searchWords, expected) => {
    expect(highlightText(textToHighlight, searchWords)).toEqual(expected)
  })
})
