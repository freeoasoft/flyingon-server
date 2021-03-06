const bunyan = require('bunyan');

const session = require('./session');

const Context = require('./context');



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
function route(routes, path, plugins) {

    let list = path.split('/');

    for (let i = 1, l = list.length; i < l; i++)
    {
        if (path = list[i])
        {
            //参数
            if (path[0] === ':')
            {
                if (i === 1)
                {
                    throw 'the first route can not use params！';
                }

                (routes[':'] || (routes = [])).push(path.substring(1));
            }
            else
            {
                routes = routes[path] || (routes[path] = Object.create(null));
            }
        }
    }

    routes[''] = plugins;
};



function matchParams(params, list, path, index) {

    for (let i = 0, l = list.length; i < l; i++)
    {
        params[list[i]] = path[index++] || '';
    }

    return index;
};


/**
 * 分发http请求
 */
async function dispatch(request, response) {

    try
    {
        let context = new Context(this, request, response);
        let routes = this.routes;
        let list = context.path.split('/');
        let index = 1;
        let any;

        while ((any = list[index++]) != null)
        {
            if (any = routes[any])
            {
                routes = any;

                if (any = routes[':'])
                {
                    index = matchParams(context.params || (context.params = {}), any, list, index);
                }
            }
            else if (any) //找不到合法路径则返回404
            {
                //404
                response.statusCode = 404;
                response.end();
                return;
            }
            
            //跳过空格
            continue;
        }

        if (list = routes[''])
        {
            //如果需要session支持
            if (list.session)
            {
                if (await session.check(context))
                {
                    await handle(this, context, list);
                }
                else if (any = this.redirectUrl) //当前无session则重定向到登录页
                {
                    context.redirect(any);
                }
                else
                {
                    context.send(500, 'session lost!');
                }
            }
            else
            {
                await handle(this, context, list);
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
                response.statusMessage = e.message || e;
            }
            catch (e)
            {
            }
        }

        response.end();
        this.log.error(e);
    }
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

    
//最后处理插件
async function end() {

};



module.exports = class App {


    constructor(settings) {

        let any;
        
        this.settings = settings || (settings = {});

        //注册的全局插件
        this.globalPlugins = [];

        //路由集合
        this.routes = Object.create(null);

        //日志
        this.log = bunyan.createLogger(settings.log || {

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

        //初始化session
        session.init(any = settings.session || {});

        //重定向url
        this.redirectUrl = any.redirectUrl || '';

        //注册检测路由
        this.route('/session-cache/:type/:key', false, session.watch);
    };



    //设置全局插件
    use(...args) {

        if (args.length > 0)
        {
            check_plugins(args, 'app use');
            this.globalPlugins.push(...args);
        }

        return this;
    };



    /**
     * 注册路由规则
     * @param url  url
     * @param session 是否需要session 可省略,默认值true
     * @param plugins 自定义插件列表
     */
    route(url, session, ...plugins) {

        if (url)
        {
            let list = this.globalPlugins.slice(0); 

            if (typeof session === 'function')
            {
                if (session[Symbol.toStringTag] !== 'AsyncFunction')
                {
                    throw 'app route plugin is not a async function!';
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
                check_plugins(plugins, 'app route');
                list.push(...plugins);
            }

            plugins = list;
            plugins.session = session;

            if (typeof url === 'string')
            {
                route(this.routes, url, plugins);
            }
            else
            {
                list = url;

                for (let i = 0, l = list.length; i < l; i++)
                {
                    if (url = list[i])
                    {
                        route(this.routes, url, plugins);
                    }
                }
            }
        }
    };


    /**
     * 获取app分发处理器
     */
    dispatchHandler() {

        return dispatch.bind(this);
    };

 

};