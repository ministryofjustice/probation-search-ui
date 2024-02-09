context('Delius search', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  it('displays welcome message', () => {
    cy.signIn()
    cy.visit('/delius/nationalSearch')
    cy.get('#search-results-container').should('contain.text', 'Find people by using any combination of:')
  })

  it('displays results', () => {
    cy.signIn()
    cy.visit('/delius/nationalSearch')
    cy.get('#search').type('test')
    cy.get('#search-results-container')
      .should('contain.text', 'Showing 1 to 2')
      .should('contain.text', 'of 2 results.')
      .should('contain.text', 'A000001')
      .should('contain.text', 'A000002')
      .should('contain.text', 'London')
      .should('contain.text', 'Practitioner, Probation')
  })

  it('navigates to help page', () => {
    cy.signIn()
    cy.visit('/delius/nationalSearch')
    cy.get('.app-national-search-help').click()
    cy.get('h1').should('contain.text', 'Search tips')
  })
})
