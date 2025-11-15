const request = require('supertest')
const app = require('../index')

describe('Health endpoint', () => {
  it('returns 200 and status', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body?.status).toBe('success')
  })
})

