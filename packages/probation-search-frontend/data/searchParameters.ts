import { Request } from 'express'
import { addParameters } from '../utils/url'

export default class SearchParameters {
  static loadFromSession(req: Request): string {
    return addParameters(req, req.session.probationSearch)
  }

  static saveToSession(req: Request) {
    req.session.probationSearch = {
      q: req.query.q as string,
      matchAllTerms: req.query.matchAllTerms as string,
      providers: req.query.providers as string[],
      page: req.query.page as string,
    }
  }

  static inSession(req: Request): boolean {
    return 'probationSearch' in req.session
  }
}
