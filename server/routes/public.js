const express = require('express')
const { query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const router = express.Router()

// Published events listing without auth
router.get('/events', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 12
    const offset = (page - 1) * limit
    const { search } = req.query

    let whereClause = `WHERE status = 'published'`
    const params = []
    let idx = 1

    if (search) {
      whereClause += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR venue_city ILIKE $${idx})`
      params.push(`%${search}%`)
      idx++
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM events ${whereClause}`, params)
    const total = parseInt(countRes.rows[0].count)

    const rowsRes = await pool.query(`
      SELECT id, title, short_description, venue_name, venue_city, venue_country, start_date, end_date, featured_image_url, tags
      FROM events
      ${whereClause}
      ORDER BY start_date ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset])

    res.json({
      success: true,
      data: {
        events: rowsRes.rows.map(e => ({
          id: e.id,
          title: e.title,
          shortDescription: e.short_description,
          venue: { name: e.venue_name, city: e.venue_city, country: e.venue_country },
          startDate: e.start_date,
          endDate: e.end_date,
          featuredImageUrl: e.featured_image_url,
          tags: e.tags
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    })
  } catch (error) {
    console.error('Public events error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

module.exports = router

