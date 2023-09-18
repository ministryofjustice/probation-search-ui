# Probation Search Front-end Components

A Nunjucks component to search for probation cases.  

Easily build probation case search functionality into your HMPPS service, while delivering a consistent search experience to probation practitioners.

Try it out in the dev environment: https://probation-search-dev.hmpps.service.justice.gov.uk

## Get started
 
### 1. Install the dependency
```shell
npm install --save @ministryofjustice/probation-search-frontend
```

### 2. Add the Nunjucks macro to your search page

Register the macro by adding the `'node_modules/@ministryofjustice/probation-search-frontend/components'` path to your 
`nunjucksSetup.ts` file, then add the following to your Nunjucks page template:

```nunjuck
{% from "probationSearch/macro.njk" import probationSearch %}

{{ probationSearch({ id: "search", name: "search", results: probationSearchResults }) }}
```

### 3. Configure the Express routes

Call the `probationSearchRoutes` function in your router setup.

```ts
import probationSearchRoutes from '@ministryofjustice/probation-search-frontend/routes/search'

probationSearchRoutes({
    router,
    path: '/search',                      // the URL path you want to display your search component on
    template: 'pages/search',             // path to your Nunjucks template file 
    environment: config.environment,      // whether you want to search cases in the dev, preprod or prod environment 
    oauthClient: service.hmppsAuthClient, // a reference to your HMPPS Auth client
})
```

That's it! Start your service and visit http://localhost:3000/search to try it out.

## Configuration

The `probationSearchRoutes` function takes the following options:

| Option           | Description                                                                                   | Default                                                                    |
|------------------|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| `environment`    | Whether you want to search cases in the dev, preprod or prod environment.                     | local                                                                      |
| `path`           | The URL to display your search component on.                                                  | /search                                                                    |
| `template`       | The path to your Nunjucks template file.                                                      | pages/search                                                               |
| `resultPath`     | A function that returns the path to the result                                                | (crn: string) => `/case/${crn}`                                            |
| `pageSize`       | The number of results to return per page.                                                     | 10                                                                         |
| `maxPagesToShow` | The maximum number of pages to show on the paginator.                                         | 7                                                                          |
| `nameFormatter`  | A function that returns a formatted name for the result.                                      | (result: ProbationSearchResult) => `${result.firstName} ${result.surname}` |
| `dateFormatter`  | A function that returns a formatted date for the result.                                      | (date: Date) => format(date, 'dd/MM/yyyy')                                 |
| `localData`      | A list of search results to return during local development (i.e. when environment = 'local') | Two dummy records - John Doe and Jane Doe                                  |

## Examples
For a fully working example, check out the [hmpps-sentence-plan-ui](https://github.com/search?q=%28repo%3Aministryofjustice%2Fhmpps-sentence-plan-ui+probationSearch%29+OR+%28repo%3Aministryofjustice%2Fhmpps-sentence-plan-ui+probation-search-frontend%29&type=code) project.

The front-end can be accessed here: https://sentence-plan-dev.hmpps.service.justice.gov.uk/search

# Support
For any issues or questions, please contact the Probation Integration team via the [#probation-integration-tech](https://mojdt.slack.com/archives/C02HQ4M2YQN)
Slack channel. Or feel free to create a [new issue](https://github.com/ministryofjustice/hmpps-probation-integration-services/issues/new)
in this repository.