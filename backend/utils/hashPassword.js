const bcrypt = require('bcryptjs');

exports.hash = (plain) => bcrypt.hashSync(plain, 10);
exports.compare = (plain, hash) => bcrypt.compareSync(plain, hash);