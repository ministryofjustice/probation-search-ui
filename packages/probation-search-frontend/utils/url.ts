import { parse, format } from 'url'

export default function addParameters(url: string, params: { [key: string]: string }): string {
  const parsedUrl = parse(url)
  const urlSearchParams = new URLSearchParams(parsedUrl.search)
  Object.entries(params).forEach(([key, value]) => urlSearchParams.set(key, value))
  parsedUrl.search = urlSearchParams.toString()
  return format(parsedUrl)
}
