import { parse } from 'node:url'
import getSuggestionLinks from './suggestions'

describe('suggestions', () => {
  it('should include the url', () => {
    const suggestions = getSuggestionLinks(
      {
        suggestions: {
          suggest: {
            mispelled: [
              {
                text: 'mispelled',
                offset: 0,
                length: 9,
                options: [
                  {
                    text: 'misspelled',
                    freq: 2,
                    score: 2,
                  },
                  {
                    text: 'mis-spelled',
                    freq: 1,
                    score: 1,
                  },
                ],
              },
            ],
            qery: [
              {
                text: 'qery',
                offset: 10,
                length: 4,
                options: [
                  {
                    text: 'query',
                    freq: 2,
                    score: 2,
                  },
                ],
              },
            ],
          },
        },
      },
      parse('https://example.com/path?q=mispelled+qery'),
    )

    expect(suggestions[0].text).toEqual('misspelled')
    expect(suggestions[0].url).toEqual('/path?q=misspelled+qery')
    expect(suggestions[1].text).toEqual('query')
    expect(suggestions[1].url).toEqual('/path?q=mispelled+query')
    expect(suggestions[2].text).toEqual('mis-spelled')
    expect(suggestions[2].url).toEqual('/path?q=mis-spelled+qery')
  })
})
