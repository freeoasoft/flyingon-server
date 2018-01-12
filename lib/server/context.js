const querystring = require('querystring');

const Session = require('./session').Session;

const parse_cookie = require('../utils/cookie');

const byteLengthUtf8 = process.binding('buffer').byteLengthUtf8;




module.exports = class {



    constructor(app, request, response) {

        let url = request.url;
        let any = url.indexOf('?');

        this.app = app;
        this.request = request;
        this.response = response;
        this.session = new Session(this);

        if (any > 0)
        {
            this.search = url.substring(any + 1);
            url = url.substring(0, any);
        }

        this.path = url;
    };



    //获取状态码
    get status() {

        return this.response.statusCode || 200;
    };


    //设置状态码
    set status(value) {

        this.response.statusCode = value || 200;
    };


    /**
     * 获取自定义Content-Type类型
     */
    get type() {

        return this.__type;
    };


    /**
     * 设置自定义Content-Type类型
     */
    set type(value) {

        switch (this.__type = value)
        {
            case 'text':
                value = 'text/plain charset=utf-8';
                break;

            case 'html':
                value = 'text/html charset=utf-8';
                break;

            case 'json':
                value = 'application/json charset=utf-8';
                break;

            case 'xml':
                value = 'text/xml charset=utf-8';
                break;

            case 'bin':
                value = 'application/octet-stream';
                break;
        }

        if (value)
        {
            this.response.setHeader('Content-Type', value);
        }
    };

    
    /**
     * 获取响应内容
     */
    get body() {

        return this.__body || '';
    };


    /**
     * 设置响应内容
     */
    set body(value) {

        this.__body = value;
    };


    /**
     * 获取请求最后修改时间
     */
    get lastModified() {

        return this.request.headers['if-modified-since'];
    };


    /**
     * 设置响应最后修改时间
     */
    set lastModified(value) {

        if (typeof value !== 'string')
        {
            value = value.toGMTString();
        }

        this.response.setHeader('Last-Modified', value);
    };


    /**
     * 获取请求实体标记
     */
    get ETag() {

        return this.request.headers['if-none-match'];
    };


    /**
     * 设置响应实体标记
     */
    set ETag(value) {

        this.response.setHeader('ETag', value);
    };


    /**
     * url查询参数
     */
    get query() {

        let value = this.__search;

        if (!value)
        {
            value = this.search;
            value = this.__search = value ? querystring.parse(value) : {};
        }

        return value;
    };

    
    /**
     * 获取客户端请求的cookies集合
     */
    get cookies() {

        return this.__cookies || (this.__cookies = parse_cookie(this.request.headers.cookie));
    };


    /**
     * 设置向客户端发送的cookie
     * @param {*} name 
     * @param {*} value 
     * @param {*} param { path, domain, expires, secure, httpOnly }
     */
    setCookie(name, value, { path, domain, expires, secure, httpOnly } = {}) {

        if (name)
        {
            let cookies = this.__set_cookes || (this.__set_cookes = []);
            let encode = encodeURIComponent;

            value = [name, '=', value ? encode(value) : value];

            if (path)
            {
                value.push('; Path=', encode(path));
            }

            if (domain)
            {
                value.push('; Domain=', encode(domain));
            }

            if (expires)
            {
                value.push('; Expires=', expires.toGMTString());
            }

            if (secure)
            {
                value.push('; Secure');
            }

            if (httpOnly)
            {
                value.push('; HttpOnly');
            }

            cookies.push(value.join(''));

            this.response.setHeader('Set-Cookie', cookies);

            return this;
        }
    };


    /**
     * 获取指定名称的session
     * @param {*} names 
     */
    async getSession(...names) {

        return await session.get(...names);
    };


    /**
     * 设置session
     * @param {*} values 
     */
    async setSession(values) {

        return await session.set(values);
    };


    /**
     * 移除指定名称的session
     * @param {*} names 
     */
    async removeSession(...names) {

        return await session.remove(...names);
    };



    /**
     * 重定向到指定地址
     * @param {*} url 
     */
    redirect(url) {

        let request = this.request;
        let response = this.response;
        let any;

        if (url === 'back')
        {
            url = request.Referrer || '/';
        }

        response.statusCode = 302;
        response.setHeader('Location', url);
    
        // html
        if ((any = request.Accept) && any.indexOf('html') >= 0)
        {
            url = encodeURIComponent(url);

            this.type = 'html';
            this.body = `Redirecting to <a href="${url}">${url}</a>.`;
        }
        else // text
        {
            this.body = `Redirecting to ${url}.`;
        }

        response.end();
    };



    /**
     * 直接发送状态码
     * 204 无内容
     * 304 无变化
     * 404 找不到对应资源
     * 405 不支持的method
     * 500 服务程序错误
     */
    send(status, message) {

        let response = this.response;

        if (message)
        {
            response.statusMessage = message;
        }

        response.statusCode = status;
        response.end();
    };



    /**
     * 处理完毕
     */
    done() {

        let response = this.response;

        //如果已发送过响应头则不进行默认处理
        if (!response.headersSent)
        {
            let type = !!this.__type;
            let body = this.__body;
            let length;

            //无内容
            if (body == null || body === '')
            {
                if (response.statusCode === 200)
                {
                    response.statusCode = 204;
                }

                response.end();
                return;
            }

            if (typeof body === 'string')
            {
                type = type || 'text/plain charset=utf-8';
                length = byteLengthUtf8(body);
            }
            else if (body instanceof Buffer) // buffer
            {
                type = type || 'application/octet-stream';
                length = body.length;
            }
            else //json
            {
                body = JSON.stringify(body);

                type = type || 'application/json charset=utf-8';
                length = byteLengthUtf8(body);
            }

            if (type !== true)
            {
                response.setHeader('Content-Type', type);
            }

            response.setHeader('Content-Length', length);

            response.end(body);
        }
    };


    /**
     * 异步接收浏览器提交的数据
     */
    async acceptData() {

        return new Promise((resolve, reject) => {

            let request = this.request;
            let data = [];

            request.on('data', chunk => {

                data.push(chunk);
            });
 
            request.on('end', () => {

                resolve(data.join(''));
            });

            request.on('error', e => {

                reject(e);
            });

        });
    };


    
    /**
     * 处理sql路由
     */
    async handleRoute(sqlclient, route) {

        let request = this.request;
        let method = request.method;
        let fn = route[method];

        if (fn)
        {
            let version, value;

            if (method === 'GET')
            {
                //支持缓存
                if (route.cache)
                {
                    //如果有缓存
                    if (version = await sqlclient.version(route.url, request.url))
                    {
                        //如果缓存版本号相同,直接返回304
                        if (version === request.headers['if-none-match'])
                        {
                            this.send(304);
                            return;
                        }

                        value = await sqlclient.cache(route.url, request.url);
                    }
                    else
                    {
                        value = await sqlclient.queryAll(fn(this));
                        version = await sqlclient.cache(route.url, request.url, value);
                    }
                    
                    //设置版本号
                    this.response.setHeader('ETag', version);
                }
                else
                {
                    value = await sqlclient.queryAll(fn(this));
                }
            }
            else
            {
                value = await this.acceptData();
                
                this.post = value ? JSON.parse(value) : {};

                value = await sqlclient.queryAll(fn(this));

                //有缓存时清除缓存
                if (route.cache)
                {
                    await sqlclient.clear(route.url, request.url);
                }
            }

            this.body = value;
        }
        else
        {
            this.send(405);
            return false;
        }
    };


};