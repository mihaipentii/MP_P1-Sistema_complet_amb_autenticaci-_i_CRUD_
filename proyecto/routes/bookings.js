const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { notify } = require('./notifications');

const router = express.Router();
router.use(requireAuth);

const overlaps = (a, b) => new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);

const validate = (body) => {
  const start = new Date(body.start);
  const end = new Date(body.end);
  if (isNaN(start) || isNaN(end)) return 'start y end deben ser fechas válidas (ISO)';
  if (start >= end) return 'start debe ser anterior a end';
  if (start < new Date()) return 'No se puede reservar en el pasado';
  return null;
};

const canEdit = (booking, user) => user.role === 'admin' || booking.userId === user.id;

router.get('/', (req, res) => {
  const { user } = req.session;
  const all = db.read('bookings');
  res.json(user.role === 'admin' ? all : all.filter((b) => b.userId === user.id));
});

router.get('/:id', (req, res) => {
  const b = db.read('bookings').find((x) => x.id === +req.params.id);
  if (!b) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (!canEdit(b, req.session.user)) return res.status(403).json({ error: 'Permisos insuficientes' });
  res.json(b);
});

router.post('/', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const resource = db.read('resources').find((r) => r.id === +req.body.resourceId);
  if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });

  const list = db.read('bookings');
  if (list.some((b) => b.resourceId === resource.id && overlaps(b, req.body)))
    return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });

  const booking = {
    id: db.nextId(list),
    userId: req.session.user.id,
    resourceId: resource.id,
    start: new Date(req.body.start).toISOString(),
    end: new Date(req.body.end).toISOString()
  };
  list.push(booking);
  db.write('bookings', list);
  notify(booking.userId, `Reserva #${booking.id} creada para "${resource.name}"`);
  res.status(201).json(booking);
});

router.put('/:id', (req, res) => {
  const list = db.read('bookings');
  const booking = list.find((x) => x.id === +req.params.id);
  if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (!canEdit(booking, req.session.user)) return res.status(403).json({ error: 'Permisos insuficientes' });

  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  if (list.some((b) => b.id !== booking.id && b.resourceId === booking.resourceId && overlaps(b, req.body)))
    return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });

  booking.start = new Date(req.body.start).toISOString();
  booking.end = new Date(req.body.end).toISOString();
  db.write('bookings', list);
  notify(booking.userId, `Reserva #${booking.id} modificada`);
  res.json(booking);
});

router.delete('/:id', (req, res) => {
  const list = db.read('bookings');
  const idx = list.findIndex((x) => x.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (!canEdit(list[idx], req.session.user)) return res.status(403).json({ error: 'Permisos insuficientes' });

  const [removed] = list.splice(idx, 1);
  db.write('bookings', list);
  notify(removed.userId, `Reserva #${removed.id} cancelada`);
  res.json(removed);
});

module.exports = router;