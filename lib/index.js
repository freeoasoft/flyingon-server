const App = module.exports = require('./server/app');

App.plugins = require('./plugins');


App.SqlClient = require('./sqlclient/sqlclient');

App.MySQLClient = require('./sqlclient/mysql');

App.PostgreSQLClient = require('./sqlclient/postgresql');