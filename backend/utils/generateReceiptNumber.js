/** Creates a time sortable, collision resistant receipt identifier. */
const crypto = require('crypto');

module.exports = () => `INU-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
