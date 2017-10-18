const plugins = module.exports = Object.create(null);

plugins.gzip = require('./gzip');
plugins.cache = require('./cache');
