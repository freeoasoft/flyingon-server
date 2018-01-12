const fs = require('fs');
const http = require('http');

const App = require('../lib');

const plugins = App.plugins;

const gzip = plugins.gzip({ level: 1 });
const cache = plugins.cache(43200);
const sqlroute = plugins.sqlroute;

//初始化配置
const settings = eval('(' + fs.readFileSync('./samples/settings.json', 'utf8') + ')');

const app = new App(settings);

let sqlclient;



//设置全局插件
app.use(gzip);


app.route('/logon', 0, require('./logon')); //不检测session

app.route('/customer', 1, cache, require('./customer'));


//创建数据库客户端
switch (settings.database.type)
{
    case 'mysql':
        sqlclient = new App.MySQLClient(settings.database.mysql);
        break;

    case 'postgresql':
        sqlclient = new App.PostgreSQLClient(settings.database.postgresql);
        break;

    default:
        throw 'not support database "' + settings.database.type + '"!';
}
    

//初始化数据库redis缓存
if (settings.database.cache === 'redis')
{
    sqlclient.initRedis(settings.database.redis);
}


//加载restful sql路由配置
let routes = sqlclient.loadRoutes(fs.readFileSync('./samples/db.js', 'utf8'));

for (let name in routes)
{
    app.route(name, sqlroute(sqlclient, routes[name]));
}


//创建http服务
const server = http.createServer(app.dispatchHandler());

server.listen(settings.http.port);
console.log('http server listening at port', settings.http.port);

