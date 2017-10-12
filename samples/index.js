const http = require('http');
const app = require('../lib');

const plugins = app.plugins;
const gzip = plugins.gzip;
const log = plugins.log;



//初始化配置
const settings = app.init('./samples/settings.json');



//设置以后路由规则前置处理插件
app.before(plugins.log);

//设置以后路由规则后置处理插件
app.after(plugins.gzip);



app.route('/logon', require('./logon'), false); //不检测session

app.route('/house', require('./house'));

app.route('/customer', require('./customer'));



//创建http服务
const server = http.createServer(app.dispatch);

server.listen(settings.http.port);
console.log('http listening at port ', settings.http.port);