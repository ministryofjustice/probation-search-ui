# Probation Search UI
[![Repository Standards](https://img.shields.io/badge/dynamic/json?color=blue&logo=github&label=MoJ%20Compliant&query=%24.message&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fprobation-search-ui)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/probation-search-ui "Link to report")

A user interface for the [Probation Search API](https://github.com/ministryofjustice/probation-offender-search).

Try it out in the dev environment: https://probation-search-dev.hmpps.service.justice.gov.uk

## Get started

### Pre-requisites

You'll need to install:

* [Node 18.x](https://nodejs.org/download/release/latest-v18.x)*
* [Docker](https://www.docker.com/)

*If you're already using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm), run:
`nvm install --latest-npm` at the project root to install the correct Node version automatically.

### Dependencies

Install NPM package dependencies:

```shell
npm install
```

### Run the service

To run the service locally, with dependencies in Docker:

```shell
# Pull the latest Docker image versions
docker-compose pull

# Start the dependencies only
docker-compose up -d --scale=app=0

# Start the UI service and watch for changes
npm run start:dev
```

Open http://localhost:3000 in your browser, and login with the following credentials:

* Username: `AUTH_USER`
* Password: `password123456`

### Integrate with dev services

Alternatively, you can integrate your local UI with the dev/test services deployed on MOJ Cloud Platform using a personal HMPPS Auth client.
If you don't already have a personal client, request one in the [#hmpps-auth-audit-registers](https://mojdt.slack.com/archives/C02S71KUBED) Slack channel.

This removes the need for using Docker.

You'll need the following roles:
* `ROLE_PROBATION_SEARCH` for searching probation cases (TBC)

Create a `.env` file at the root of the project:
```properties
NODE_ENV=development
ENVIRONMENT=dev
REDIS_ENABLED=false
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
PROBATION_SEARCH_API_URL=https://probation-offender-search-dev.hmpps.service.justice.gov.uk

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

## Testing
### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

To run the Cypress integration tests locally:

```shell
# Start dependencies
docker-compose -f docker-compose-test.yml up -d

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