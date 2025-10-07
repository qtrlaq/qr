const { db, save } = require('../db');
const { nanoid } = require('nanoid');

function getActiveSessionByCode(code) {
  return db.data.sessions.find(s => s.code === code && s.active);
}

function markAttendance(sessionId, studentId) {
  const exists = db.data.attendance.find(a => a.session_id === sessionId && a.student_id === studentId);
  if (exists) throw new Error('already-marked');
  db.data.attendance.push({ id: nanoid(), session_id: sessionId, student_id: studentId, marked_at: new Date().toISOString() });
  save();
}

module.exports = { getActiveSessionByCode, markAttendance };


