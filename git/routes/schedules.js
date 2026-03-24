const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// Helper: Convert empty strings to null
const nullIfEmpty = (value) => value === '' ? null : value;

// Helper: Parse schedule data from request body
const parseScheduleData = (req) => {
  return {
    name: req.body.name,
    description: req.body.description,
    next_update: nullIfEmpty(req.body.next_update),
    schedule_months: req.body.schedule_months || [],
    schedule_occurrence: req.body.schedule_occurrence,
    schedule_day: req.body.schedule_day,
    schedule_time: req.body.schedule_time,
    recipientemail: req.body.recipientemail,
  };
};

// Get all schedules for the logged-in user (with recipient details)
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.*,
        r.name as recipientname,
        r.email as recipientemail
      FROM schedules s
      LEFT JOIN recipients r ON r.id = s.recipientid
      ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Add a new schedule
router.post('/', requireAuth, async (req, res) => {
  try {
    const scheduleData = parseScheduleData(req);

    // First, find the recipient ID based on email
    const recipientResult = await pool.query(
      'SELECT id FROM recipients WHERE email = $1',
      [scheduleData.recipientemail]
    );

    if (recipientResult.rowCount === 0) {
      return res.status(400).json({ error: 'Recipient not found' });
    }

    const recipientId = recipientResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO schedules (
        name, description, next_update,
        schedule_months, schedule_occurrence, schedule_day, schedule_time, recipientid
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *`,
      [
        scheduleData.name,
        scheduleData.description,
        scheduleData.next_update,
        scheduleData.schedule_months,
        scheduleData.schedule_occurrence,
        scheduleData.schedule_day,
        scheduleData.schedule_time,
        recipientId,
      ]
    );

    // Return the created schedule with recipient details
    const createdSchedule = result.rows[0];
    const scheduleWithRecipient = await pool.query(`
      SELECT
        s.*,
        r.name as recipientname,
        r.email as recipientemail
      FROM schedules s
      LEFT JOIN recipients r ON r.id = s.recipientid
      WHERE s.id = $1
    `, [createdSchedule.id]);

    res.status(201).json(scheduleWithRecipient.rows[0]);
  } catch (err) {
    console.error('Error creating schedule:', err);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Update a schedule
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleData = parseScheduleData(req);

    // Find the recipient ID based on email
    const recipientResult = await pool.query(
      'SELECT id FROM recipients WHERE email = $1',
      [scheduleData.recipientemail]
    );

    if (recipientResult.rowCount === 0) {
      return res.status(400).json({ error: 'Recipient not found' });
    }

    const recipientId = recipientResult.rows[0].id;

    const result = await pool.query(
      `UPDATE schedules SET
        name = $1,
        description = $2,
        next_update = $3,
        schedule_months = $4,
        schedule_occurrence = $5,
        schedule_day = $6,
        schedule_time = $7,
        recipientid = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [
        scheduleData.name,
        scheduleData.description,
        scheduleData.next_update,
        scheduleData.schedule_months,
        scheduleData.schedule_occurrence,
        scheduleData.schedule_day,
        scheduleData.schedule_time,
        recipientId,
        id,
      ]
    );

    if (result.rowCount === 0) return res.sendStatus(404);

    // Return the updated schedule with recipient details
    const updatedSchedule = await pool.query(`
      SELECT
        s.*,
        r.name as recipientname,
        r.email as recipientemail
      FROM schedules s
      LEFT JOIN recipients r ON r.id = s.recipientid
      WHERE s.id = $1
    `, [id]);

    res.json(updatedSchedule.rows[0]);
  } catch (err) {
    console.error('Error updating schedule:', err);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete a schedule
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM schedules WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) return res.sendStatus(404);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting schedule:', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

module.exports = router;
