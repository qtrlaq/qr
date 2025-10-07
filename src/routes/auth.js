const express = require('express');
const bcrypt = require('bcryptjs');
const { db, save } = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.render('auth/login', { error: 'Неверные учетные данные' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.render('auth/login', { error: 'Неверные учетные данные' });
  req.session.user = { id: user.id, email: user.email, role: user.role };
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/signup', { error: null });
});

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('auth/signup', { error: 'Заполните поля' });
  const exists = db.data.users.find(u => u.email === email);
  if (exists) return res.render('auth/signup', { error: 'Пользователь уже существует' });
  const hash = await bcrypt.hash(password, 10);
  db.data.users.push({ id: require('nanoid').nanoid(), email, password_hash: hash, role: 'student', created_at: new Date().toISOString() });
  save();
  res.redirect('/login');
});

module.exports = router;


