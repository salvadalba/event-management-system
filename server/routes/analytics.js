const express = require('express');
const { query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get system overview analytics (super admin only)
router.get('/overview', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const cache = require('../utils/cache')
    const { data: cachedData, cached } = await cache.wrap('analytics:overview', 'global', 60, async () => {
      const [
        eventsResult,
        usersResult,
        registrationsResult,
        revenueResult
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM events'),
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM registrations WHERE status != \'cancelled\''),
        pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM registrations WHERE payment_status = \'paid\'')
      ])

      const recentEventsResult = await pool.query(`
        SELECT id, title, created_at
        FROM events
        ORDER BY created_at DESC
        LIMIT 5
      `)

      const recentRegistrationsResult = await pool.query(`
        SELECT r.id, r.first_name, r.last_name, r.email, e.title as event_title, r.created_at
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        ORDER BY r.created_at DESC
        LIMIT 5
      `)

      return {
        totals: {
          events: parseInt(eventsResult.rows[0].count),
          users: parseInt(usersResult.rows[0].count),
          registrations: parseInt(registrationsResult.rows[0].count),
          revenue: parseFloat(revenueResult.rows[0].total)
        },
        recentActivity: {
          events: recentEventsResult.rows,
          registrations: recentRegistrationsResult.rows
        }
      }
    })
    if (cached) res.set('X-Cache', 'HIT')
    res.json({
      success: true,
      data: cachedData
    })
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get event analytics
router.get('/events/:id', authenticate, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check event access
    const eventResult = await pool.query(
      'SELECT id, title, organizer_id FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    if (req.user.role !== 'super_admin' && event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    let dateFilter = '';
    const params = [id];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND r.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      dateFilter += ` AND r.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Get registration summary
    const [
      registrationResult,
      revenueResult,
      checkinResult,
      ticketTypeResult
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'waitlisted' THEN 1 END) as waitlisted
        FROM registrations
        WHERE event_id = $1
      `, params),

      pool.query(`
        SELECT
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count
        FROM registrations
        WHERE event_id = $1
      `, params),

      pool.query(`
        SELECT COUNT(*) as checked_in
        FROM checkins
        WHERE event_id = $1
      `, [id]),

      pool.query(`
        SELECT
          t.type,
          COUNT(r.id) as registrations,
          COALESCE(SUM(r.total_amount), 0) as revenue
        FROM tickets t
        LEFT JOIN registrations r ON t.id = r.ticket_id AND r.status != 'cancelled'
        WHERE t.event_id = $1
        GROUP BY t.type
      `, [id])
    ]);

    const registrationStats = registrationResult.rows[0];
    const revenueStats = revenueResult.rows[0];
    const checkinStats = checkinResult.rows[0];

    // Get registration trends (last 30 days)
    const trendsResult = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as registrations
      FROM registrations
      WHERE event_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `, [id]);

    // Get traffic sources (if available)
    const trafficSourcesResult = await pool.query(`
      SELECT
        COALESCE(referral_source, 'Direct') as source,
        COUNT(*) as count
      FROM registrations
      WHERE event_id = $1 AND referral_source IS NOT NULL
      GROUP BY referral_source
      ORDER BY count DESC
      LIMIT 10
    `, [id]);

    const totalRegistrations = parseInt(registrationStats.total);
    const totalCheckins = parseInt(checkinStats.checked_in);
    const attendanceRate = totalRegistrations > 0 ? (totalCheckins / totalRegistrations * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalRegistrations,
          confirmedRegistrations: parseInt(registrationStats.confirmed),
          cancelledRegistrations: parseInt(registrationStats.cancelled),
          waitlistedRegistrations: parseInt(registrationStats.waitlisted),
          totalRevenue: parseFloat(revenueStats.total_revenue),
          paidCount: parseInt(revenueStats.paid_count),
          pendingCount: parseInt(revenueStats.pending_count),
          totalCheckins,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        },
        ticketTypes: ticketTypeResult.rows.map(row => ({
          type: row.type,
          registrations: parseInt(row.registrations),
          revenue: parseFloat(row.revenue)
        })),
        trends: trendsResult.rows.map(row => ({
          date: row.date,
          registrations: parseInt(row.registrations)
        })),
        trafficSources: trafficSourcesResult.rows.map(row => ({
          source: row.source,
          count: parseInt(row.count)
        }))
      }
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get registration trends across all events
router.get('/trends', authenticate, authorize('super_admin'), [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d' } = req.query;

    let interval = 'day';
    let dateRange = '30 days';

    switch (period) {
      case '7d':
        interval = 'hour';
        dateRange = '7 days';
        break;
      case '30d':
        interval = 'day';
        dateRange = '30 days';
        break;
      case '90d':
        interval = 'day';
        dateRange = '90 days';
        break;
      case '1y':
        interval = 'week';
        dateRange = '1 year';
        break;
    }

    // Get registration trends
    const trendsResult = await pool.query(`
      SELECT
        DATE_TRUNC('${interval}', r.created_at) as date,
        COUNT(*) as registrations,
        COUNT(CASE WHEN r.payment_status = 'paid' THEN 1 END) as paid_registrations,
        COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_amount ELSE 0 END), 0) as revenue
      FROM registrations r
      WHERE r.created_at >= CURRENT_DATE - INTERVAL '${dateRange}'
      GROUP BY DATE_TRUNC('${interval}', r.created_at)
      ORDER BY date
    `);

    // Get top performing events
    const topEventsResult = await pool.query(`
      SELECT
        e.id,
        e.title,
        COUNT(r.id) as registrations,
        COALESCE(SUM(r.total_amount), 0) as revenue
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'cancelled'
      WHERE r.created_at >= CURRENT_DATE - INTERVAL '${dateRange}' OR r.created_at IS NULL
      GROUP BY e.id, e.title
      HAVING COUNT(r.id) > 0
      ORDER BY revenue DESC
      LIMIT 10
    `);

    // Get ticket type performance
    const ticketPerformanceResult = await pool.query(`
      SELECT
        t.type,
        COUNT(r.id) as registrations,
        COALESCE(SUM(r.total_amount), 0) as revenue,
        AVG(r.total_amount) as avg_revenue
      FROM tickets t
      LEFT JOIN registrations r ON t.id = r.ticket_id AND r.status != 'cancelled' AND r.created_at >= CURRENT_DATE - INTERVAL '${dateRange}'
      GROUP BY t.type
      ORDER BY registrations DESC
    `);

    res.json({
      success: true,
      data: {
        trends: trendsResult.rows.map(row => ({
          date: row.date,
          registrations: parseInt(row.registrations),
          paidRegistrations: parseInt(row.paid_registrations),
          revenue: parseFloat(row.revenue)
        })),
        topEvents: topEventsResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          registrations: parseInt(row.registrations),
          revenue: parseFloat(row.revenue)
        })),
        ticketPerformance: ticketPerformanceResult.rows.map(row => ({
          type: row.type,
          registrations: parseInt(row.registrations),
          revenue: parseFloat(row.revenue),
          avgRevenue: parseFloat(row.avg_revenue)
        }))
      }
    });
  } catch (error) {
    console.error('Get trends analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Export analytics data
router.get('/export', authenticate, authorize('super_admin', 'event_manager'), [
  query('type').isIn(['events', 'registrations', 'revenue']),
  query('format').isIn(['csv', 'json']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('eventId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type, format, startDate, endDate, eventId } = req.query;

    let query = '';
    let filename = '';
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Add date filters
    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Add event filter for non-super admins
    if (req.user.role !== 'super_admin') {
      whereClause += ` AND organizer_id = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (eventId) {
      whereClause += ` AND id = $${paramIndex++}`;
      params.push(eventId);
    }

    switch (type) {
      case 'events':
        query = `
          SELECT
            id, title, status, venue_name, venue_city, venue_country,
            start_date, end_date, max_attendees, current_attendees,
            created_at, updated_at
          FROM events
          ${whereClause}
          ORDER BY created_at DESC
        `;
        filename = `events_export_${Date.now()}`;
        break;

      case 'registrations':
        query = `
          SELECT
            r.id, r.first_name, r.last_name, r.email, r.phone,
            r.company, r.job_title, r.quantity, r.total_amount,
            r.status, r.payment_status, r.registration_code,
            r.created_at, e.title as event_title
          FROM registrations r
          JOIN events e ON r.event_id = e.id
          ${whereClause.replace('WHERE 1=1', 'WHERE r.status != \'cancelled\'')}
          ORDER BY r.created_at DESC
        `;
        filename = `registrations_export_${Date.now()}`;
        break;

      case 'revenue':
        query = `
          SELECT
            r.id, r.total_amount, r.payment_status, r.payment_id,
            r.created_at, e.title as event_title, r.email,
            CONCAT(r.first_name, ' ', r.last_name) as attendee_name
          FROM registrations r
          JOIN events e ON r.event_id = e.id
          WHERE r.payment_status = 'paid'
          ${startDate ? `AND r.created_at >= $${paramIndex++}` : ''}
          ${endDate ? `AND r.created_at <= $${paramIndex++}` : ''}
          ${req.user.role !== 'super_admin' ? `AND e.organizer_id = $${paramIndex++}` : ''}
          ${eventId ? `AND r.event_id = $${paramIndex++}` : ''}
          ORDER BY r.created_at DESC
        `;
        filename = `revenue_export_${Date.now()}`;
        break;
    }

    const result = await pool.query(query, params);

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(result.rows[0] || {});
      const csvRows = [
        headers.join(','),
        ...result.rows.map(row =>
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvRows);
    } else {
      res.json({
        success: true,
        data: {
          type,
          count: result.rows.length,
          records: result.rows
        }
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error exporting data'
    });
  }
});

module.exports = router;
