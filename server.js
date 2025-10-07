const path = require('path');
const express = require('express');
const session = require('express-session');
const { ensureSeedTeacher } = require('./src/db');

const authRoutes = require('./src/routes/auth');
const teacherRoutes = require('./src/routes/teacher');
const studentRoutes = require('./src/routes/student');

const { requireAuth } = require('./src/middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
  })
);

app.use((req, res, next) => {
	res.locals.currentUser = req.session.user || null;
	next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	if (!req.session.user) return res.redirect('/login');
	if (req.session.user.role === 'teacher') return res.redirect('/teacher');
	return res.redirect('/student');
});

app.use(authRoutes);
app.use('/teacher', requireAuth('teacher'), teacherRoutes);
app.use('/student', requireAuth('student'), studentRoutes);

// Session QR scan endpoint, requires student auth; redirects to login if needed
const { getActiveSessionByCode, markAttendance } = require('./src/services/attendance');
app.get('/s/:code', async (req, res) => {
	const { code } = req.params;
	if (!req.session.user) {
		req.session.returnTo = `/s/${code}`;
		return res.redirect('/login');
	}
	if (req.session.user.role !== 'student') {
		return res.status(403).send('Only students can scan attendance');
	}
	const sessionRec = getActiveSessionByCode(code);
	if (!sessionRec) return res.status(404).send('Session not found or inactive');
	try {
		markAttendance(sessionRec.id, req.session.user.id);
		return res.render('student/confirmed', { sessionRec });
	} catch (e) {
		return res.status(400).send('Already marked or error');
	}
});

const PORT = process.env.PORT || 3000;

ensureSeedTeacher().then(() => {
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
});


