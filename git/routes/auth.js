const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const pool = require('../db')
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET

router.post('/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).send('Missing fields')

  const hash = await bcrypt.hash(password, 10)

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, hash]
    )
    res.status(201).json({ userId: result.rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).send('Error creating user')
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
  const user = result.rows[0]

  if (!user) return res.status(401).send('Invalid credentials')

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) return res.status(401).send('Invalid credentials')

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' })
  res.json({ token })
})

module.exports = router
