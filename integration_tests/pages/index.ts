import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Search for a person on probation')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')
}
