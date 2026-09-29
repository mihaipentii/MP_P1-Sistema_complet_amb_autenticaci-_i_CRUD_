const fs = require('fs');
const path = require('path');

const file = (name) => path.join(__dirname, 'db', `${name}.json`);

exports.read = (name) => JSON.parse(fs.readFileSync(file(name), 'utf8'));
exports.write = (name, data) => fs.writeFileSync(file(name), JSON.stringify(data, null, 2));
exports.nextId = (list) => (list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1);