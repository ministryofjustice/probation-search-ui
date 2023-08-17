import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Search for people on probation')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  courtRegisterLink = (): PageElement => cy.get('[href="/court-register"]')
}
