const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const router = express.Router()

// Get all schedules for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT name, email from recipients')
  res.json(result.rows)
})

module.exports = router
