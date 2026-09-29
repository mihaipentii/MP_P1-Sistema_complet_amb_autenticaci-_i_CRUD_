const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar';
exports.SECRET = SECRET;

// Carga el usuario del token en req.session.user
exports.authenticate = (req, res, next) => {
  req.session = { user: null };
  const token = req.cookies.access_token;
  if (token) {
    try {
      req.session.user = jwt.verify(token, SECRET);
    } catch {
      res.clearCookie('access_token');
    }
  }
  next();
};

// Para la API: responde 401 en JSON
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  next();
};

// Para páginas: redirige al login
exports.requirePage = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

exports.requireRole = (role) => (req, res, next) => {
  if (req.session.user.role !== role)
    return res.status(403).json({ error: 'Permisos insuficientes' });
  next();
};