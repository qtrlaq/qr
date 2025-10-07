const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const recent = db.data.attendance
    .filter(a => a.student_id === req.session.user.id)
    .sort((a,b) => (a.marked_at < b.marked_at ? 1 : -1))
    .slice(0, 10)
    .map(a => ({ marked_at: a.marked_at, session_id: a.session_id }));
  res.render('student/dashboard', { recent });
});

router.get('/scan', (req, res) => {
  res.render('student/scan');
});

module.exports = router;


