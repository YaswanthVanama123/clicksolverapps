const jwt = require('jsonwebtoken');

const payload = {
  uid: 0,
  name: 'admin'
};

const secret = 's8q8lh6N_cYYK4IClsH6dwEOlcXNnn35WE-kQWlTEAs';

const token = jwt.sign(payload, secret, { expiresIn: '10y' });

console.log(token);
