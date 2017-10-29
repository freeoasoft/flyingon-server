# flyingon-server
* flyingon-server是一个类似koa的nodejs restful服务框架
* 简洁轻量, 性能高效, 易扩展及维护
* 基于es7的async及await设计及开发
* async异步插件化设计, 可轻易编写自定义插件实现功能扩展
* 内置session管理, 支持分布式session缓存(默认使用redis)
* 支持gzip压缩, 浏览器缓存(ETag, Last-Modified, max-age)
* 统一的关系数据库访问引擎, 默认支持MySQL及PostgreSQL
* 独创的sql restful功能, 可通过配置sql自动生成增删改查的restful服务, 自动配置动态sql, 支持针对不同数据库编写不同的sql, 支持参数化查询, 支持GET结果缓存

![](https://www.travis-ci.org/freeoasoft/flyingon-server.svg?branch=master)

## Installation
`npm install flyingon-server`

## sql rest配置
```javascript
URL('/test', true);

GET(`select * from test${
    WHERE(IIF('{#0}', 'f1={#0}?', ''))
}`);

POST(`insert into test(${ FOR('@', '{name}') }) values(${ FOR('@', '{value}?') }) ${

    TYPE({
        postgresql: 'returning id'
    })

}`);

PUT(`update test set ${ FOR('@', '{name}={value}?') } where f1={#0}?`);

DELETE('delete from test where f1={#0}?');
```

## 系统配置
```json
{
    //http配置
    "http": {
        "port": 8085
    },

    //session配置
    "session": {
        "timeout": 20,              //session过期时间(分钟)
        "max": 1000,                //本地最大缓存数量
        "redirectUrl": "/logon",    //session校验不通过时重定向地址
        "cache": "redis",           //使用redis缓存作为session保存方式
        "redis": {                  //redis配置
            "host": "127.0.0.1",    //redis地址
            "port": 6379            //redis端口
        }
    },

    //数据库配置
    "database": {
        "type": "mysql",           //数据库类型
        "postgresql": {                 //postgresql参数
            "user": "postgres",
            "database": "test",
            "password": "123456",
            "port": 5432,
            "max": 20,                  //连接池最大连接数
            "idleTimeoutMillis": 3000   //连接最大空闲时间 3s
        },
        "mysql": {                      //mysql参数
            "connectionLimit": 10,
            "host": "127.0.0.1",
            "user": "root",
            "password": "123456",
            "database": "test"
        },
        "cache": "redis",               //使用redis缓存作为查询缓存
        "redis": {                      //redis配置
            "host": "127.0.0.1",        //redis地址
            "port": 6379                //redis端口
        }
    }
}
```

## 示例
```javascript
const fs = require('fs');
const http = require('http');

//加载flyingon-server
const App = require('flyingon-server');

//获取默认插件集合
const plugins = App.plugins;

//初始化插件
const gzip = plugins.gzip({ level: 1 });
const cache = plugins.cache(43200);
const sqlroute = plugins.sqlroute;

//初始化配置
const settings = eval('(' + fs.readFileSync('系统配置文件地址', 'utf8') + ')');

//创建app实例
const app = new App(settings);


//设置全局插件
app.use(gzip);


//设置路由规则
app.route('/logon', false, require('./logon')); //第二个参数为false表示不检测session

app.route('/customer', cache, require('./customer'));


//创建数据库客户端
let sqlclient;

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
let routes = sqlclient.loadRoutes(fs.readFileSync('sql rest配置文件地址', 'utf8'));

for (let name in routes)
{
    app.route(name, sqlroute(sqlclient, routes[name]));
}


//创建http服务
const server = http.createServer(app.dispatchHandler());

server.listen(settings.http.port);
console.log('http server listening at port', settings.http.port);
```

## 插件
注册的插件方法必须符合"async (context, next)"签名, 其中context为当前上次文, next为下一个插件调用方法
以下为gzip压缩插件示例:

```javascript
const zlib = require('zlib');


module.exports = function (options) {
    
    let minLength = options.minLength || 1024;

    function compress(context, body) {

        let encoding = context.request.headers['accept-encoding'];

        if (encoding)
        {
            if (encoding.indexOf('gzip') >= 0)
            {
                context.response.setHeader('Content-Encoding', 'gzip');
                context.body = zlib.gzipSync(body, options);
            }
            else if (encoding.indexOf('deflate') >= 0)
            {
                context.response.setHeader('Content-Encoding', 'deflate');
                context.body = zlib.deflateSync(body, options);
            }
        }
    };

    return async function (context, next) {

        let body, type;

        await next();

        if (!context.response.headersSent && (body = context.body))
        {
            type = !!context.type;

            if (typeof body === 'string')
            {
                type = type || 'text/plain charset=utf-8';
            }
            else if (body instanceof Buffer) // buffer
            {
                type = type || 'application/octet-stream';
            }
            else //json
            {
                body = JSON.stringify(body);
                type = type || 'application/json charset=utf-8';
            }

            if (type !== true)
            {
                context.type = type;
            }

            if (body.length > minLength)
            {
                compress(context, body);
            }
        }
    };

};
```