context('Search', () => {
  it('displays results', () => {
    cy.visit('/search')
    cy.get('#search').type('test')
    cy.get('button').click()
    cy.get('#search-results-container')
      .should('contain.text', 'Showing 1 to 2')
      .should('contain.text', 'of 2 results.')
      .should('contain.text', 'John')
      .should('contain.text', 'Jane')
  })
})
