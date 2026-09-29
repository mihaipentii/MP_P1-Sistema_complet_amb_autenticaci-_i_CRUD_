const express = require('express');
const jwt = require('jsonwebtoken');
const users = require('../user-repository');
const { SECRET, requirePage } = require('../middleware/auth');

const router = express.Router();

const setToken = (res, user) => {
  const token = jwt.sign(user, SECRET, { expiresIn: '1h' });
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // secure exige HTTPS
    maxAge: 1000 * 60 * 60
  });
};

router.get('/', (req, res) => res.render('index', { user: req.session.user }));
router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/register', async (req, res) => {
  try {
    const user = await users.create(req.body);
    setToken(res, user);
    res.redirect('/protected');
  } catch (e) {
    res.status(400).render('login', { error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await users.login(req.body);
    setToken(res, user);
    res.redirect('/protected');
  } catch (e) {
    res.status(401).render('login', { error: e.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.redirect('/');
});

router.get('/protected', requirePage, (req, res) =>
  res.render('protected', { user: req.session.user })
);
router.get('/profile', requirePage, (req, res) =>
  res.render('profile', { user: req.session.user })
);

module.exports = router;