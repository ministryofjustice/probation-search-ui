import { Request } from 'express'

export function getAbsoluteUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`
}

export function addParameters(url: string | Request, params?: Record<string, string | string[]>): string {
  const newUrl = new URL(typeof url === 'string' ? url : getAbsoluteUrl(url))
  if (params)
    Object.entries(params).forEach(([key, value]) => {
      newUrl.searchParams.delete(key)
      if (Array.isArray(value)) {
        value.forEach(v => newUrl.searchParams.append(key, v.toString()))
      } else {
        newUrl.searchParams.set(key, value.toString())
      }
    })
  return newUrl.toString()
}

export function removeParameters(url: string | Request, ...params: string[]): string {
  const newUrl = new URL(typeof url === 'string' ? url : getAbsoluteUrl(url))
  params.forEach(key => newUrl.searchParams.delete(key))
  return newUrl.toString()
}
