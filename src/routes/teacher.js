const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { db, save } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const sessions = db.data.sessions
    .filter(s => s.teacher_id === req.session.user.id)
    .sort((a,b) => (a.started_at < b.started_at ? 1 : -1))
    .slice(0, 10);
  const active = sessions.find(s => s.active);
  const recentAttendance = active
    ? db.data.attendance
        .filter(a => a.session_id === active.id)
        .sort((a,b) => (a.marked_at < b.marked_at ? 1 : -1))
        .map(a => ({ marked_at: a.marked_at, email: (db.data.users.find(u => u.id === a.student_id) || {}).email }))
    : [];
  res.render('teacher/dashboard', { sessions, active, recentAttendance });
});

router.post('/start', (req, res) => {
  const active = db.data.sessions.find(s => s.teacher_id === req.session.user.id && s.active);
  if (active) return res.redirect('/teacher');
  const code = uuidv4();
  const id = uuidv4();
  db.data.sessions.push({ id, teacher_id: req.session.user.id, code, active: true, started_at: new Date().toISOString(), ended_at: null });
  save();
  res.redirect('/teacher');
});

router.post('/stop', (req, res) => {
  db.data.sessions.forEach(s => {
    if (s.teacher_id === req.session.user.id && s.active) {
      s.active = false;
      s.ended_at = new Date().toISOString();
    }
  });
  save();
  res.redirect('/teacher');
});

router.get('/qrcode', async (req, res) => {
  const active = db.data.sessions.find(s => s.teacher_id === req.session.user.id && s.active);
  if (!active) return res.status(404).send('Нет активной сессии');
  const scanUrl = `${req.protocol}://${req.get('host')}/s/${active.code}`;
  const png = await QRCode.toDataURL(scanUrl, { width: 512, margin: 1 });
  res.render('teacher/qrcode', { scanUrl, png });
});

router.get('/attendance/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const sessionRow = db.data.sessions.find(s => s.id === sessionId && s.teacher_id === req.session.user.id);
  if (!sessionRow) return res.status(404).send('Сессия не найдена');
  const rows = db.data.attendance
    .filter(a => a.session_id === sessionId)
    .sort((a,b) => (a.marked_at < b.marked_at ? 1 : -1))
    .map(a => ({ marked_at: a.marked_at, email: (db.data.users.find(u => u.id === a.student_id) || {}).email }));
  res.render('teacher/attendance', { sessionRow, rows });
});

module.exports = router;


