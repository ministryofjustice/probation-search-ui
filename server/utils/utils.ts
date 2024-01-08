import { Chunk, findAll } from 'highlight-words-core'
import { endOfDay, isAfter } from 'date-fns'
import { createHmac, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import config from '../config'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const highlightText = (textToHighlight?: string, query?: string, shouldHighlight: boolean = true): string => {
  if (!shouldHighlight || !textToHighlight || !query) {
    return textToHighlight
  }
  return findAll({
    textToHighlight,
    searchWords: query?.split(' ') ?? [],
    autoEscape: true,
  })
    .map(({ end, highlight, start }: Chunk) => {
      const text = textToHighlight.substring(start, end)
      return highlight ? `<span class="highlighted-text">${text}</span>` : text
    })
    .join('')
}

/**
 * Sign the URL and add the signature as a query parameter.
 *
 * @param path the URL to sign (relative path)
 * @param expiresAt the expiry date, defaults to the end of the current day.
 */
export const signUrl = (path: string, expiresAt?: Date): string => {
  const expiry = (expiresAt ?? endOfDay(new Date())).getTime()
  const signature = createHmac(config.signing.algorithm, config.signing.secret)
    .update(`${path};${expiry}`)
    .digest('hex')
  return `${path}?signature=${signature}&expiry=${expiry}`
}

export const verifySignedUrl = (request: Request): boolean => {
  const signature = request.query.signature as string
  const expiry = request.query.expiry as string
  const expected = createHmac(config.signing.algorithm, config.signing.secret)
    .update(`${request.path};${expiry}`)
    .digest('hex')
  return (
    isAfter(Number(expiry), new Date()) &&
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
}
