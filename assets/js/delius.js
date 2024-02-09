;(deliusUrl => {
  function debounce(fn, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), delay)
    }
  }

  function handleError(error) {
    document.getElementById('search-results-container').innerHTML =
      '<div class="govuk-error-summary"><h2 class="govuk-error-summary__title">Something went wrong</h2><div class="govuk-error-summary__body">The error has been logged. Please try again.</div></div>'
    document.getElementById('search-suggestions').innerHTML = ''
    throw error
  }

  function retry(promiseFn, retries, delay) {
    return new Promise((resolve, reject) => {
      promiseFn()
        .then(resolve)
        .catch(error => {
          if (retries > 0)
            setTimeout(
              () =>
                retry(promiseFn, retries - 1, delay)
                  .then(resolve)
                  .catch(reject),
              delay,
            )
          reject(error || new Error('Maximum retries exceeded'))
        })
    })
  }

  function resetPageNumber() {
    const url = new URL(location.href)
    url.search = '' // reset page number
    location.href = url
  }

  function doSearch() {
    retry(
      () =>
        fetch(location.href, {
          method: 'POST',
          body: new URLSearchParams(new FormData(document.getElementById('search-form'))),
        }),
      3,
      100,
    )
      .then(async response => {
        if (response.ok) {
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html')
          if (document.getElementById('search-error') || doc.getElementById('search-error'))
            document.getElementById('search-form').submit()
          document.getElementById('search-results-container').innerHTML =
            doc.getElementById('search-results-container').innerHTML
          document.getElementById('search-results-container').classList =
            doc.getElementById('search-results-container').classList
          document.getElementById('search-suggestions').innerHTML = doc.getElementById('search-suggestions').innerHTML
          document.getElementsByName('_csrf')[0].value = doc.getElementsByName('_csrf')[0].value
        } else {
          handleError(new Error('Search request failed with status ' + response.status))
        }
      })
      .catch(reason => handleError(new Error(reason)))
  }

  function saveFilters(selectedProviders) {
    const matchAllTerms = document.querySelector('input[name="match-all-terms"]:checked')
    const providers =
      selectedProviders ?? [...document.querySelectorAll('input[name="providers-filter"]:checked')].map(el => el.value)
    localStorage.setItem('providers', JSON.stringify(providers))
    return fetch('/delius/nationalSearch/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _csrf: document.getElementsByName('_csrf')[0].value,
        matchAllTerms: matchAllTerms ? matchAllTerms.value : 'true',
        providers: providers,
      }),
    })
  }

  function postMessage(action, source) {
    let eventData = {
      _csrf: document.getElementsByName('_csrf')[0].value,
      action: action,
    }
    if (source) {
      eventData.index = +source.getAttribute('data-index')
      eventData.crn = source.getAttribute('data-crn')
    }
    const event = new Blob([JSON.stringify(eventData)], { type: 'application/json' })
    navigator.sendBeacon('/delius/nationalSearch/trackEvent', event)

    top.postMessage(
      JSON.stringify({
        action: action,
        data: source?.getAttribute('data-offender-id') ?? {},
      }),
      { targetOrigin: deliusUrl },
    )
  }

  function setup() {
    // Load filters from local storage
    saveFilters(JSON.parse(localStorage.getItem('providers')))

    // Register event listeners
    document.getElementById('search-results-container').addEventListener('input', e => {
      if (e.target.name === 'match-all-terms' || e.target.name === 'providers-filter') {
        debounce(() => saveFilters().then(resetPageNumber), 500)()
      }
    })
    document.getElementById('search-results-container').addEventListener('click', e => {
      const target = e.target.closest('a')
      if (target && target.classList.contains('view-offender-link')) postMessage('viewOffender', target)
      if (target && target.classList.contains('add-contact-link')) postMessage('addContact', target)
    })
    document.getElementById('add-new-person-link').addEventListener('click', () => postMessage('addOffender'))
    document.getElementById('previous-search-link').addEventListener('click', () => postMessage('toggleSearch'))

    // Focus on input
    const search = document.getElementById('search')
    search.focus() // the autofocus attribute doesn't work in a cross-origin iframe
    search.setSelectionRange(search.value.length, search.value.length) // focus at end of field

    // Enable search on typing
    document.getElementById('search').addEventListener('input', debounce(doSearch, 250))
    document.getElementById('search-form').addEventListener('submit', e => {
      doSearch()
      e.preventDefault()
    })
  }

  setup()
})(deliusUrl)
