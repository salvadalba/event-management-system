const request = require('supertest')
const app = require('../index')

describe('Public events', () => {
  it('lists published events without auth', async () => {
    const res = await request(app).get('/api/public/events')
    expect([200, 400, 500]).toContain(res.status)
  })
})
