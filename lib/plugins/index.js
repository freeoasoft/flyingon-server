const plugins = module.exports = Object.create(null);

plugins.gzip = require('./gzip');

plugins.cache = require('./cache');

plugins.sqlroute = require('./sqlroute');

// plugins['session-cache'] = require('./session-cache');

// plugins['database-cache'] = require('./database-cache');