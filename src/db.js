const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const file = path.join(dataDir, 'db.json');
const defaultData = { users: [], sessions: [], attendance: [], settings: {} };
let data;
try {
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    data = raw ? JSON.parse(raw) : { ...defaultData };
  } else {
    data = { ...defaultData };
  }
} catch (e) {
  data = { ...defaultData };
}

const db = { data };

function save() {
  try {
    fs.writeFileSync(file, JSON.stringify(db.data, null, 2), 'utf8');
  } catch (_) {}
}

function getSetting(key, defaultValue = null) {
  return Object.prototype.hasOwnProperty.call(db.data.settings, key)
    ? db.data.settings[key]
    : defaultValue;
}

function setSetting(key, value) {
  db.data.settings[key] = value;
  save();
}

async function ensureSeedTeacher() {
  const teacher = db.data.users.find(u => u.role === 'teacher');
  if (!teacher) {
    const email = process.env.TEACHER_EMAIL || 'teacher@example.com';
    const password = process.env.TEACHER_PASSWORD || 'teacher123';
    const hash = await bcrypt.hash(password, 10);
    db.data.users.push({ id: nanoid(), email, password_hash: hash, role: 'teacher', created_at: new Date().toISOString() });
    console.log('Seeded default teacher:', email);
  }
  if (getSetting('allowStudentSignup') === null) setSetting('allowStudentSignup', 'true');
  save();
}

module.exports = {
  db,
  save,
  getSetting,
  setSetting,
  ensureSeedTeacher
};


