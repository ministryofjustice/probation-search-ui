interface PageLink {
  number: number
  current: boolean
  href: string
}

export interface Pagination {
  from: number
  to: number
  next: string
  prev: string
  items: (PageLink | { ellipsis: boolean })[]
}

export default function getPaginationLinks(
  currentPage: number,
  totalPages: number,
  totalResults: number,
  pathFn: (pageNumber: number) => string,
  pageSize: number,
  maxPagesToShow: number,
): Pagination {
  const firstPage = firstPageToShow(currentPage, maxPagesToShow)
  const lastPage = lastPageToShow(currentPage, maxPagesToShow, totalPages)
  return {
    from: (currentPage - 1) * pageSize + 1,
    to: Math.min(currentPage * pageSize, totalResults),
    next: currentPage < totalPages ? pathFn(currentPage + 1) : null,
    prev: currentPage > 1 ? pathFn(currentPage - 1) : null,
    items: getPageLinks(firstPage, lastPage, currentPage, totalPages, pathFn),
  }
}

function firstPageToShow(currentPage: number, maxPagesToShow: number) {
  return Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1)
}

function lastPageToShow(currentPage: number, maxPagesToShow: number, totalPages: number) {
  return Math.min(currentPage + Math.floor(maxPagesToShow / 2), totalPages)
}

function getPageLinks(
  firstPage: number,
  lastPage: number,
  currentPage: number,
  totalPages: number,
  pathFn: (pageNumber: number) => string,
): (PageLink | { ellipsis: boolean })[] {
  return [
    ...(firstPage > 1 ? [{ ellipsis: true }] : []),
    ...Array.from({ length: lastPage - firstPage + 1 }, (_, i) => firstPage + i).map(pageNumber => ({
      number: pageNumber,
      current: currentPage === pageNumber,
      href: pathFn(pageNumber),
    })),
    ...(lastPage < totalPages ? [{ ellipsis: true }] : []),
  ]
}
