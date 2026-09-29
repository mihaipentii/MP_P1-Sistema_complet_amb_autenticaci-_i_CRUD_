const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Función usada por otras rutas para generar notificaciones
router.notify = (userId, message) => {
  const list = db.read('notifications');
  list.push({
    id: db.nextId(list),
    userId,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });
  db.write('notifications', list);
};

router.get('/', (req, res) =>
  res.json(db.read('notifications').filter((n) => n.userId === req.session.user.id))
);

router.put('/:id', (req, res) => {
  const list = db.read('notifications');
  const n = list.find((x) => x.id === +req.params.id && x.userId === req.session.user.id);
  if (!n) return res.status(404).json({ error: 'Notificación no encontrada' });
  n.read = true;
  db.write('notifications', list);
  res.json(n);
});

router.delete('/:id', (req, res) => {
  const list = db.read('notifications');
  const idx = list.findIndex((x) => x.id === +req.params.id && x.userId === req.session.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Notificación no encontrada' });
  const [removed] = list.splice(idx, 1);
  db.write('notifications', list);
  res.json(removed);
});

module.exports = router;