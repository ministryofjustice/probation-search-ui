import { Chunk, findAll } from 'highlight-words-core'

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

export const highlightText = (textToHighlight?: string, searchWords?: string[]): string =>
  searchWords && searchWords.length > 0
    ? findAll({ searchWords, textToHighlight })
        .map(({ end, highlight, start }: Chunk) => {
          const text = textToHighlight.substring(start, end)
          return highlight ? `<span class="highlighted-text">${text}</span>` : text
        })
        .join('')
    : textToHighlight
