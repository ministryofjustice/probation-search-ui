import { format, parseISO } from 'date-fns'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import ProbationSearchClient, { ProbationSearchResult } from '../data/probationSearchClient'
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
  localData?: ProbationSearchResult[]
  allowEmptyQuery?: boolean
  pageSize?: number
  maxPagesToShow?: number
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
  localData = [
    { firstName: 'John', surname: 'Doe', dateOfBirth: '1980-01-01', otherIds: { crn: 'A000001' } },
    { firstName: 'Jane', surname: 'Doe', dateOfBirth: '1982-02-02', otherIds: { crn: 'A000002' } },
  ],
  allowEmptyQuery = false,
  pageSize = 10,
  maxPagesToShow = 7,
}: ProbationSearchRouteOptions): Router {
  const client = new ProbationSearchClient(oauthClient, environment === 'local' ? localData : environment)

  router.post(path, (req, res) => {
    const { search } = req.body
    if (!allowEmptyQuery && (search == null || search.length === 0)) {
      res.render(template, {
        probationSearchResults: {
          errorMessage: { text: 'Please enter a search term' },
          ...defaultResult(res),
        },
      })
    } else {
      res.redirect(`${path}?q=${req.body.search}`)
    }
  })

  router.get(
    path,
    wrapAsync(async (req, res) => {
      const query = req.query.q as string
      if (query == null || query === '') {
        res.render(template, { probationSearchResults: defaultResult(res) })
      } else {
        const currentPage = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
        const results = await client.search(query, res.locals.user.username, currentPage, pageSize)
        res.render(template, {
          probationSearchResults: {
            query,
            headers: [{ text: 'Name' }, { text: 'CRN' }, { text: 'Date of Birth' }],
            results: results.content?.map(result => [
              { html: `<a href="${resultPath(result.otherIds.crn)}">${nameFormatter(result)}</a>` },
              { text: result.otherIds.crn },
              { text: result.dateOfBirth ? dateFormatter(parseISO(result.dateOfBirth)) : '' },
            ]),
            page: calculatePagination(
              currentPage,
              results.totalPages,
              results.totalElements,
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
