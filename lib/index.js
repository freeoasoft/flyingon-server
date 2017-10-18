const app = module.exports = require('./server/app');

app.plugins = require('./plugins');
app.resql = require('./resql');