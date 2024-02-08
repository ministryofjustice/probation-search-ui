context('Search', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  it('displays results', () => {
    cy.signIn()
    cy.get('#search').type('test')
    cy.get('button').click()
    cy.get('#search-results-container')
      .should('contain.text', 'Showing 1 to 2')
      .should('contain.text', 'of 2 results.')
      .should('contain.text', 'John')
      .should('contain.text', 'Jane')
  })
})
