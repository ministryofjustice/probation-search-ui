# Probation Search UI
[![Repository Standards](https://img.shields.io/badge/dynamic/json?color=blue&logo=github&label=MoJ%20Compliant&query=%24.message&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fprobation-search-ui)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/probation-search-ui "Link to report")

A user interface for the [Probation Search API](https://github.com/ministryofjustice/probation-offender-search). 
Try it out in the dev environment: https://probation-search-dev.hmpps.service.justice.gov.uk

This project makes use of a re-usable probation search component. 
To include this in your project, check out the [@ministryofjustice/probation-search-frontend](https://www.npmjs.com/package/@ministryofjustice/probation-search-frontend) package.

## Get started

### Pre-requisites

You'll need to install:

* [Node 21.x](https://nodejs.org/download/release/latest-v21.x)*

*If you're already using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm), run:
`nvm install --latest-npm` at the project root to install the correct Node version automatically.

### Dependencies

Install NPM package dependencies:

```shell
npm install
```

### Run the service

To run the service locally, with dependencies in WireMock:

```shell
# Mock the dependencies
npm run wiremock

# Start the UI service and watch for changes
npm run start:dev
```

Open http://localhost:3000 in your browser.

### Integrate with dev services

Alternatively, you can integrate your local UI with the dev/test services deployed on MOJ Cloud Platform using a personal HMPPS Auth client.
If you don't already have a personal client, request one in the [#hmpps-auth-audit-registers](https://mojdt.slack.com/archives/C02S71KUBED) Slack channel.

You'll need the following roles:
* `ROLE_COMMUNITY` for searching probation cases

Create a `.env` file at the root of the project:
```properties
NODE_ENV=development
ENVIRONMENT_NAME=dev
REDIS_ENABLED=false
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
MANAGE_USERS_API_URL=https://manage-users-api-dev.hmpps.service.justice.gov.uk
PRISON_API_URL=https://prison-api-dev.prison.service.justice.gov.uk

# Add your personal client credentials below:
API_CLIENT_ID=clientid
API_CLIENT_SECRET=clientsecret
SYSTEM_CLIENT_ID=clientid
SYSTEM_CLIENT_SECRET=clientsecret
```

Then, start the UI service:
```shell
npm run start:dev
```

## Development

### Running with HTTPS

This service also provides the Delius search screen (see [/delius/nationalSearch](https://probation-search-dev.hmpps.service.justice.gov.uk/delius/nationalSearch)), 
which is loaded in an iframe in the Delius application.
For it to work in a cross-site iframe context, the Express session cookie must be served over HTTPS.

To enable HTTPS during local development, first create a self-signed certificate:
```shell
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem
```

Then, in the `.env` file, add the following:
```properties
INGRESS_URL=https://localhost:3000
HTTPS_KEY=key.pem
HTTPS_CERT=cert.pem
```

You will also need to add `https://localhost:3000/sign-in/callback` as a registered redirect URI for your auth client.

## Testing
### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

To run the Cypress integration tests locally:

```shell
# Start the UI in test mode
npm run start-feature:dev

# Run the tests in headless mode:
npm run int-test

# Or, run the tests with the Cypress UI:
npm run int-test-ui
```

### Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`