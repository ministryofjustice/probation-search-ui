import { Url } from 'url'
import { ProbationSearchResponse } from '../data/probationSearchClient'

export interface SuggestionLink {
  text: string
  url: string
}

export default function getSuggestionLinks(
  response: { suggestions?: ProbationSearchResponse['suggestions'] },
  originalUrl: Url,
): SuggestionLink[] {
  return Object.values(response?.suggestions?.suggest || {})
    .flatMap(suggestions => suggestions.flatMap(s => s.options.map(o => ({ ...s, ...o }))))
    .sort((a, b) => b.score - a.score || b.freq - a.freq)
    .slice(0, 3)
    .map(s => {
      const params = new URLSearchParams(originalUrl.search)
      params.set('q', params.get('q').slice(0, s.offset) + s.text + params.get('q').slice(s.offset + s.length))
      return { url: `${originalUrl.pathname}?${params.toString()}`, ...s }
    })
}
