const app = module.exports = Object.create(null);

const plugins = app.plugins = Object.create(null);

const routes = app.routes = Object.create(null);

const session_get = require('./session').get;

const Context = require('./context');


//登录页面地址
let logon = '';



//处理器基类
app.Handler = require('./handler');



//注册插件
app.plugin = (name, fn) => {

    if (name && typeof fn === 'function')
    {
        plugins[name] = fn;
    }

    return app;
};



//注册路由
function route(path, handler) {

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

    stack[''] = handler;
};



/**
 * 注册路由规则
 */
app.route = (path, handler, session) => {

    if (path)
    {
        let any;

        handler = new handler();

        handler.__session = session !== false;
        handler.__before = (any = app.__before) ? any.slice(0) : [];
        handler.__after = (any = app.__after) ? any.slice(0) : [];

        if (typeof path === 'string')
        {
            route(path, handler);
        }
        else
        {
            let list = path;

            for (let i = 0, l = list.length; i < l; i++)
            {
                if (path = list[i])
                {
                    route(path, handler);
                }
            }
        }

        return handler;
    }
};


//设置全局前置处理插件
app.before = (...args) => {

    app.__before = args;
    return app;
};


//设置全局后置处理插件
app.after = (...args) => {

    app.__after = args;
    return app;
};


    
/**
 * 分发http请求
 */
app.dispatch = async (request, response) => {
 
    let context = new Context(request, response);
    let stack = routes;
    let args = context.args;
    let handler, path, any;

    for (let i = 1, l = args.length; i < l; i++)
    {
        if (path = args[i])
        {
            if (any = stack[path])
            {
                stack = any;
            }
            else
            {
                args.splice(0, i);
                break;
            }
        }
    }

    if (handler = stack[''])
    {
        //如果需要session支持
        if (handler.__session)
        {
            //当前无session则重定向到登录页
            if (false === await session_get(context))
            {
                context.redirect(logon);
                return
            }
        }

        handler.__handle(context);
    }
    else
    {
        //404
        response.statusCode = 404;
        response.end();
    }
};



//初始化配置
app.init = file => {

    let settings = require('fs').readFileSync(file, 'utf8');
    let any;

    app.settings = settings = eval('(' + settings + ')');

    logon = settings.http.logon;

    if (any = settings.session)
    {
        require('./session').init(any);
    }

    return settings;
};