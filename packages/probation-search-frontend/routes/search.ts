import { format, parseISO } from 'date-fns'
import { Request, Response, Router } from 'express'
import parseurl from 'parseurl'
import ProbationSearchClient, {
  ProbationSearchRequest,
  ProbationSearchResponse,
  ProbationSearchResult,
} from '../data/probationSearchClient'
import OAuthClient from '../data/oauthClient'
import data from '../data/localData'
import getPaginationLinks, { Pagination } from '../utils/pagination'
import getSuggestionLinks, { SuggestionLink } from '../utils/suggestions'
import wrapAsync from '../utils/middleware'
import addParameters from '../utils/url'

export default function probationSearchRoutes({
  environment,
  oauthClient,
  router,
  path = '/search',
  resultPath = (crn: string) => `/case/${crn}`,
  template = 'pages/search',
  templateFields = () => ({}),
  nameFormatter = (result: ProbationSearchResult) => `${result.firstName} ${result.surname}`,
  dateFormatter = (date: Date) => format(date, 'dd/MM/yyyy'),
  resultsFormatter = defaultResultFormatter(resultPath, nameFormatter, dateFormatter),
  localData = data,
  allowEmptyQuery = false,
  pageSize = 10,
  maxPagesToShow = 7,
}: ProbationSearchRouteOptions): Router {
  const client = new ProbationSearchClient(oauthClient, environment === 'local' ? localData : environment)

  router.post(path, post({ allowEmptyQuery, template, templateFields }))
  router.get(path, get(client, { pageSize, maxPagesToShow, resultsFormatter, template, templateFields }))

  return router
}

export function post({ allowEmptyQuery, template, templateFields }: PostOptions) {
  return (req: Request, res: Response) => {
    const query = req.body['probation-search-input']
    if (!allowEmptyQuery && (query == null || query.length === 0)) {
      const probationSearchResults: ResultTemplateParams = {
        errorMessage: { text: 'Please enter a search term' },
        ...securityParams(res),
      }
      res.render(template, { probationSearchResults, ...templateFields(req, res) })
    } else {
      res.redirect(addParameters(req.url, { q: query, page: '1' }))
    }
  }
}

export function get(
  client: ProbationSearchClient,
  { resultsFormatter, template, templateFields, pageSize, maxPagesToShow }: GetOptions,
) {
  return wrapAsync(async (req: Request, res: Response) => {
    const query = req.query.q as string
    if (query == null || query === '') {
      // No query, render empty search screen
      res.render(template, { probationSearchResults: securityParams(res), ...templateFields(req, res) })
    } else {
      // Render search results
      const pageNumber = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      const matchAllTerms = (req.query.matchAllTerms ?? 'true') === 'true'
      const providersFilter = (req.query.providers as string[]) ?? []
      const asUsername = res.locals.user.username
      const request = { query, matchAllTerms, providersFilter, asUsername, pageNumber, pageSize }

      const response = await client.search(request)

      const probationSearchResults: ResultTemplateParams = {
        query,
        response,
        results: await resultsFormatter(response, request),
        suggestions: getSuggestionLinks(response, parseurl(req)),
        pagination: getPaginationLinks(
          pageNumber,
          response.totalPages,
          response.totalElements,
          page => addParameters(req.url, { page: page.toString() }),
          pageSize,
          maxPagesToShow,
        ),
        ...securityParams(res),
      }
      res.render(template, { probationSearchResults, ...templateFields(req, res) })
    }
  })
}

function defaultResultFormatter(
  resultPath: (crn: string) => string,
  nameFormatter: (probationSearchResult: ProbationSearchResult) => string,
  dateFormatter: (date: Date) => string,
): (response: ProbationSearchResponse, request: ProbationSearchRequest) => Promise<string | Table> {
  return async (response: ProbationSearchResponse) => ({
    head: [{ text: 'Name' }, { text: 'CRN' }, { text: 'Date of Birth' }],
    rows: response.content?.map(result =>
      result.accessDenied
        ? [{ html: `Restricted access` }, { text: result.otherIds.crn }, { text: '' }]
        : [
            { html: `<a href="${resultPath(result.otherIds.crn)}">${nameFormatter(result)}</a>` },
            { text: result.otherIds.crn },
            { text: result.dateOfBirth ? dateFormatter(parseISO(result.dateOfBirth)) : '' },
          ],
    ),
  })
}

function securityParams(res: Response): { csrfToken: string; cspNonce: string; user: { username: string } } {
  return {
    csrfToken: res.locals.csrfToken,
    cspNonce: res.locals.cspNonce,
    user: res.locals.user,
  }
}

interface GetOptions {
  path?: string
  pageSize?: number
  maxPagesToShow?: number
  template?: string
  templateFields?: (req: Request, res: Response) => object
  resultPath?: (crn: string) => string
  nameFormatter?: (result: ProbationSearchResult) => string
  dateFormatter?: (date: Date) => string
  resultsFormatter?: (
    apiResponse: ProbationSearchResponse,
    apiRequest: ProbationSearchRequest,
  ) => Promise<string | Table>
}

interface PostOptions {
  path?: string
  template?: string
  templateFields?: (req: Request, res: Response) => object
  allowEmptyQuery?: boolean
}

export type ProbationSearchRouteOptions = {
  environment: 'local' | 'dev' | 'preprod' | 'prod'
  oauthClient: OAuthClient
  router: Router
  localData?: ProbationSearchResult[]
} & GetOptions &
  PostOptions

interface SuccessParams {
  query: string
  results: string | Table
  response: ProbationSearchResponse
  suggestions: SuggestionLink[]
  pagination: Pagination
  csrfToken: string
  cspNonce: string
}

interface ErrorParams {
  errorMessage: { text: string }
  csrfToken: string
  cspNonce: string
}

export type ResultTemplateParams = SuccessParams | ErrorParams

export interface Table {
  head: { text: string }[]
  rows: { html?: string; text?: string }[][]
}
