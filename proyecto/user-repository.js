const bcrypt = require('bcrypt');
const db = require('./db');

exports.create = async ({ username, password }) => {
  if (typeof username !== 'string' || username.trim().length < 3)
    throw new Error('El usuario debe tener al menos 3 caracteres');
  if (typeof password !== 'string' || password.length < 6)
    throw new Error('La contraseña debe tener al menos 6 caracteres');

  const users = db.read('users');
  if (users.some((u) => u.username === username.trim()))
    throw new Error('El usuario ya existe');

  const user = {
    id: db.nextId(users),
    username: username.trim(),
    password: await bcrypt.hash(password, 10),
    role: users.length === 0 ? 'admin' : 'user' // el primer usuario es admin
  };
  users.push(user);
  db.write('users', users);
  return { id: user.id, username: user.username, role: user.role };
};

exports.login = async ({ username, password }) => {
  const user = db.read('users').find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    throw new Error('Credenciales incorrectas');
  return { id: user.id, username: user.username, role: user.role };
};