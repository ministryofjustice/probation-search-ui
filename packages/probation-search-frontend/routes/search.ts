import { format, parseISO } from 'date-fns'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import parseurl from 'parseurl'
import ProbationSearchClient, {
  ProbationSearchRequest,
  ProbationSearchResponse,
  ProbationSearchResult,
} from '../data/probationSearchClient'
import OAuthClient from '../data/oauthClient'

export interface ProbationSearchRouteOptions {
  environment: 'local' | 'dev' | 'preprod' | 'prod'
  oauthClient: OAuthClient
  router: Router
  path?: string
  resultPath?: (crn: string) => string
  template?: string
  nameFormatter?: (result: ProbationSearchResult) => string
  dateFormatter?: (date: Date) => string
  resultsFormatter?: (apiResponse: ProbationSearchResponse, apiRequest: ProbationSearchRequest) => string | Table
  localData?: ProbationSearchResult[]
  allowEmptyQuery?: boolean
  pageSize?: number
  maxPagesToShow?: number
}

export interface Table {
  head: { text: string }[]
  rows: { html?: string; text?: string }[][]
}

export default function probationSearchRoutes({
  environment,
  oauthClient,
  router,
  path = '/search',
  resultPath = (crn: string) => `/case/${crn}`,
  template = 'pages/search',
  nameFormatter = (result: ProbationSearchResult) => `${result.firstName} ${result.surname}`,
  dateFormatter = (date: Date) => format(date, 'dd/MM/yyyy'),
  resultsFormatter = (response: ProbationSearchResponse) => {
    return {
      head: [{ text: 'Name' }, { text: 'CRN' }, { text: 'Date of Birth' }],
      rows: response.content?.map(result => [
        { html: `<a href="${resultPath(result.otherIds.crn)}">${nameFormatter(result)}</a>` },
        { text: result.otherIds.crn },
        { text: result.dateOfBirth ? dateFormatter(parseISO(result.dateOfBirth)) : '' },
      ]),
    }
  },
  localData = [
    {
      otherIds: { crn: 'A000001' },
      firstName: 'John',
      surname: 'Doe',
      dateOfBirth: '1980-01-01',
      age: 43,
      gender: 'Male',
      currentDisposal: '1',
    },
    {
      firstName: 'Jane',
      surname: 'Doe',
      dateOfBirth: '1982-02-02',
      age: 41,
      gender: 'Female',
      currentDisposal: '0',
      otherIds: { crn: 'A000002' },
    },
  ],
  allowEmptyQuery = false,
  pageSize = 10,
  maxPagesToShow = 7,
}: ProbationSearchRouteOptions): Router {
  const client = new ProbationSearchClient(oauthClient, environment === 'local' ? localData : environment)

  router.post(path, (req, res) => {
    const query = req.body['probation-search-input']
    if (!allowEmptyQuery && (query == null || query.length === 0)) {
      res.render(template, {
        probationSearchResults: {
          errorMessage: { text: 'Please enter a search term' },
          ...defaultResult(res),
        },
      })
    } else {
      res.redirect(`${path}?q=${query}`)
    }
  })

  router.get(
    path,
    wrapAsync(async (req, res) => {
      const query = req.query.q as string
      const providers = (req.query.providers as string[]) ?? []
      const matchAllTerms = (req.query.matchAllTerms ?? 'true') === 'true'
      if (query == null || query === '') {
        res.render(template, { probationSearchResults: defaultResult(res) })
      } else {
        const currentPage = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
        const request = {
          query,
          matchAllTerms,
          providersFilter: providers,
          asUsername: res.locals.user.username,
          page: currentPage,
          size: pageSize,
        }
        const response = await client.search(request)
        const results = resultsFormatter(response, request)
        res.render(template, {
          probationSearchResults: {
            query,
            results,
            response,
            suggestions: Object.values(response?.suggestions?.suggest || {})
              .flatMap(suggestions =>
                suggestions.flatMap(s =>
                  s.options.map(opts => {
                    const params = new URLSearchParams(parseurl(req).search)
                    params.set('q', query.slice(0, s.offset) + opts.text + query.slice(s.offset + s.length))
                    return { url: `${path}?${params.toString()}`, ...opts }
                  }),
                ),
              )
              .sort((a, b) => b.score - a.score || b.freq - a.freq)
              .slice(0, 3),
            page: calculatePagination(
              currentPage,
              response.totalPages,
              response.totalElements,
              page => `${path}?q=${query}&page=${page}`,
              pageSize,
              maxPagesToShow,
            ),
            ...defaultResult(res),
          },
        })
      }
    }),
  )

  return router
}

function defaultResult(res: Response) {
  return {
    csrfToken: res.locals.csrfToken,
    cspNonce: res.locals.cspNonce,
  }
}

function calculatePagination(
  currentPage: number,
  totalPages: number,
  totalResults: number,
  pathFn: (pageNumber: number) => string,
  pageSize: number,
  maxPagesToShow: number,
) {
  const firstPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1)
  const lastPage = Math.min(currentPage + Math.floor(maxPagesToShow / 2), totalPages)
  return {
    totalResults: totalResults.toLocaleString(),
    from: (currentPage - 1) * pageSize + 1,
    to: Math.min(currentPage * pageSize, totalResults),
    next: currentPage < totalPages ? pathFn(currentPage + 1) : null,
    prev: currentPage > 1 ? pathFn(currentPage - 1) : null,
    items: [
      ...(firstPage > 1 ? [{ ellipsis: true }] : []),
      ...Array.from({ length: lastPage - firstPage + 1 }, (_, i) => firstPage + i).map(pageNumber => ({
        number: pageNumber,
        current: currentPage === pageNumber,
        href: pathFn(pageNumber),
      })),
      ...(lastPage < totalPages ? [{ ellipsis: true }] : []),
    ],
  }
}

function wrapAsync(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
