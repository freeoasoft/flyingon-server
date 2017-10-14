
//最后处理插件
async function end() {

};



module.exports = class {
    


    /**
     * 设置插件, 如果设置了全局插件则全局插件先执行
     */
    use(...args) {

        if (args)
        {
            for (let i = args.length - 1; i >= 0; i--)
            {
                if (typeof args[i] !== 'function')
                {
                    args.splice(i, 1);
                }
            }

            if (args[0])
            {
                this.__plugins.splice(-1, 0, ...args);
            }
        }

        return this;
    };


    //处理
    async __handle(context) {

        let plugins = this.__plugins;
        let index = 1;
        let fn = plugins[index++];

        let next = fn ? async () => {
            
            fn.call(this, context, (fn = plugins[index++]) ? next : end);

        } : end;
        
        await plugins[0].call(this, context, next);
        this.done(context);
    };


    /**
     * 执行处理
     * @param {*} context 
     * @param {*} next 
     */
    async execute(context, next) {

        let fn = this[context.request.method];

        if (fn)
        {
            await fn.call(this, context, next);
        }
        else
        {
            let response = context.response;

            //不支持的method
            response.statusCode = 405;
            response.end();
        }
    };


    
    /**
     * 执行完毕处理
     */
    done(context) {

        let response = context.response;

        //如果已发送过响应头则不进行默认处理
        if (!response.headerSent)
        {
            let type = !!context.__type;
            let body = context.__body;
            let length;

            //无内容
            if (body == null || body === '')
            {
                if (response.statusCode === 200)
                {
                    response.statusCode = 204;
                }

                response.end();
            }

            if (typeof body === 'string')
            {
                type = type || 'text/plain charset=utf-8';
                length = Buffer.byteLength(body);
            }
            else if (Buffer.isBuffer(body)) // buffer
            {
                type = type || 'application/octet-stream';
                length = body.length;
            }
            else //json
            {
                body = JSON.stringify(body);

                type = type || 'application/json charset=utf-8';
                length = Buffer.byteLength(body);
            }

            if (type !== true)
            {
                response.setHeader('Content-Type', type);
            }

            response.setHeader('Content-Length', length);

            response.end(body);
        }
    };


    //错误处理
    onerror(context, error) {

        try
        {
            let response = context.response;

            response.statusCode = 500;
            response.end();

            debugger
            //log
        }
        catch (e)
        {
            //
        }
    };


    /**
     * 接收浏览器提交的数据
     * @param {*} context 
     */
    acceptData(context) {

        return new Promise((resolve, reject) => {

            let request = context.request;
            let data = [];

            request.on('data', function (chunk) {

                data.push(chunk);
            });
 
            request.on('end', function () {

                resolve(data.join(''));
            });

            request.on('error', function (e) {

                return reject(e);
            });

        });
    };


};