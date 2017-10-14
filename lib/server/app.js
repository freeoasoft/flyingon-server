const app = module.exports = Object.create(null);

const plugins = app.plugins = Object.create(null);

const routes = app.routes = Object.create(null);

const session = require('./session');

const Context = require('./context');


//登录页面地址
let logon = '';



//处理器基类
app.Handler = require('./handler');



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
        handler = new handler();

        handler.__session = session !== false;
        handler.__plugins = [...(app.__plugins || []), handler.execute];

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



//设置全局插件
app.use = (...args) => {

    if (args)
    {
        for (let i = args.length - 1; i >= 0; i--)
        {
            if (typeof args[i] !== 'function')
            {
                args.splice(i, 1);
            }
        }
    }

    app.__plugins = args;
    return app;
};


    
/**
 * 分发http请求
 */
app.dispatch = (request, response) => {
 
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
            session.check(context).then(value => { 
                
                if (value)
                {
                    handler.__handle(context);
                }
                else
                {
                    context.redirect(logon);
                    handler.done(context);
                }

            }).catch(error => {
                
                handler.onerror(context, error);
            });
        }
        else
        {
            handler.__handle(context);
        }
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

    settings = app.settings = eval('(' + settings + ')');

    logon = settings.http.logon;

    session.init(settings.session);

    return settings;
};