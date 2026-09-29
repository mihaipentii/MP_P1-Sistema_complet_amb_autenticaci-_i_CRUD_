const express = require('express');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(authenticate);

app.use('/', require('./routes/auth'));
app.use('/resources', require('./routes/resources'));
app.use('/bookings', require('./routes/bookings'));
app.use('/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));