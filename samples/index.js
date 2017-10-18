const fs = require('fs');
const http = require('http');

const app = require('../lib');

const plugins = app.plugins;

const gzip = plugins.gzip({ level: 1 });
const cache = plugins.cache(43200);



//初始化配置
const settings = app.init(fs.readFileSync('./samples/settings.json', 'utf8'));



//设置全局插件
app.use(gzip);



app.route('/logon', false, require('./logon')); //不检测session

app.route('/customer', cache, require('./customer'));



//创建http服务
const server = http.createServer(app.dispatch);

server.listen(settings.http.port);
console.log('http server listening at port', settings.http.port);


let routes = app.resql(require('fs').readFileSync('./samples/db.js', 'utf8'));

//创建postgresql连接池
let pool = new (require('pg').Pool)(settings.database);
let postgresql = require('./postgresql');

for (var name in routes)
{
    app.route(name, postgresql(routes[name], pool));
}
