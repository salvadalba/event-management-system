const { render } = require('../utils/emailTemplates')

describe('Email templates', () => {
  it('renders basic template', () => {
    const html = render('basic', { subject: 'Hello', message: 'Welcome!' })
    expect(html).toContain('Hello')
    expect(html).toContain('Welcome')
  })
})

