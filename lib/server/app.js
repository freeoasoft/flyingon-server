const app = module.exports = Object.create(null);

const routes = app.routes = Object.create(null);

const bunyan = require('bunyan');

const session = require('./session');

const Context = require('./context');


//登录页面地址
let logon = '';



//注册的全局插件
app.globalPlugins = [];



//检查插件是否异步函数
function check_plugins(plugins, name) {

    for (let i = plugins.length - 1; i >= 0; i--)
    {
        let fn = plugins[i];

        if (typeof fn !== 'function' && fn[Symbol.toStringTag] !== 'AsyncFunction')
        {
            throw name + ' plugin is not a async function!';
        }
    }
};



//注册路由
function route(path, plugins) {

    let list = path.split('/');
    let stack = routes;

    for (let i = 1, l = list.length; i < l; i++)
    {
        let path = list[i];

        if (path)
        {
            stack = stack[path] || (stack[path] = Object.create(null));
        }
    }

    stack[''] = plugins;
};



/**
 * 注册路由规则
 * @param url  url
 * @param session 是否需要session 可省略,默认值true
 * @param plugins 自定义插件列表
 */
app.route = (url, session, ...plugins) => {

    if (url)
    {
        let list = app.globalPlugins.slice(0); 

        if (typeof session === 'function')
        {
            if (session[Symbol.toStringTag] !== 'AsyncFunction')
            {
                throw 'app.route plugin is not a async function!';
            }

            list.push(session);
            session = true;
        }
        else
        {
            session = !!session;
        }

        if (plugins.length > 0)
        {
            check_plugins(plugins, 'app.route');
            list.push(...plugins);
        }

        plugins = list;
        plugins.session = session;

        if (typeof url === 'string')
        {
            route(url, plugins);
        }
        else
        {
            list = url;

            for (let i = 0, l = list.length; i < l; i++)
            {
                if (url = list[i])
                {
                    route(url, plugins);
                }
            }
        }
    }
};



//设置全局插件
app.use = (...args) => {

    if (args.length > 0)
    {
        check_plugins(args, 'app.use');
        app.globalPlugins.push(...args);
    }

    return app;
};


    
/**
 * 分发http请求
 */
app.dispatch = async (request, response) => {
 
    try
    {
        let context = new Context(app, request, response);
        let stack = routes;
        let paths = context.paths;
        let list, any;

        for (let i = 0, l = paths.length; i < l; i++)
        {
            if (list = paths[i])
            {
                if (any = stack[list])
                {
                    stack = any;
                }
                else
                {
                    paths.splice(0, i);
                    break;
                }
            }
        }

        if (list = stack[''])
        {
            //如果需要session支持
            if (list.session)
            {
                //当前无session则重定向到登录页
                if (!await session.check(context))
                {
                    context.redirect(logon);
                }
                else
                {
                    await handle(app, context, list);
                }
            }
            else
            {
                await handle(app, context, list);
            }
        }
        else
        {
            //404
            response.statusCode = 404;
            response.end();
        }
    }
    catch (e)
    {
        if (!response.headersSent)
        {
            try
            {
                response.statusCode = 500;
                response.statusMessage = e.message;
            }
            catch (e)
            {
            }
        }

        response.end();
        app.log.error(e);
    }
};


//最后处理插件
async function end() {

};


//请求处理
async function handle(app, context, plugins) {

    let index = 1;
    let fn = plugins[index++];

    let next = fn ? async () => {
        
        await fn.call(app, context, (fn = plugins[index++]) ? next : end);

    } : end;

    await plugins[0].call(app, context, next);
    context.done();
};

    

//创建默认日志对象
app.log = bunyan.createLogger({

    name: 'flyingon-server',
    src: true,
    streams: [
        {
            type: 'rotating-file',
            path: './log/log.txt',
            period: '1d',
            count: 31
        }
    ]
});


//初始化配置
app.init = text => {

    let settings = app.settings = typeof text === 'string' ? eval('(' + text + ')') : text;

    logon = settings.http.logon;

    session.init(settings.session || {});

    if (settings.log)
    {
        app.log = bunyan.createLogger(settings.log);
    }

    return settings;
};