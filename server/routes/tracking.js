const express = require('express')
const { pool } = require('../config/database')
const router = express.Router()

const PIXEL = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
)

router.get('/open/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE communication_logs SET status = 'opened', opened_at = CURRENT_TIMESTAMP WHERE tracking_id = $1`,
      [id]
    )
  } catch (_) {}
  res.setHeader('Content-Type', 'image/gif')
  res.send(PIXEL)
})

router.get('/click/:id', async (req, res) => {
  try {
    const { id } = req.params
    const to = req.query.to
    await pool.query(
      `UPDATE communication_logs SET status = 'clicked', clicked_at = CURRENT_TIMESTAMP WHERE tracking_id = $1`,
      [id]
    )
    if (to) return res.redirect(String(to))
  } catch (_) {}
  return res.status(204).end()
})

module.exports = router

