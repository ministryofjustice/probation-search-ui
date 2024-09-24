export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    probationSearch?: ProbationSearch.SearchParameters
    contactSearch?: ContactSearch.SearchParameters
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }
  }
  namespace ProbationSearch {
    interface SearchParameters extends Record<string, string | string[]> {
      query?: string
      providers?: string[]
      matchAllTerms?: string
    }
  }
  namespace ContactSearch {
    interface SearchParameters extends Record<string, string | string[]> {
      query?: string
    }
  }
}
