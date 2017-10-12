const querystring = require('querystring');

const session = require('./session');

const parse_cookie = require('../utils/cookie');



module.exports = class {



    constructor(request, response) {

        let url = request.url;
        let index = url.indexOf('?');

        this.request = request;
        this.response = response;

        if (index > 0)
        {
            this.search = url.substring(index + 1);
            url = url.substring(0, index);
        }

        //当前路由参数
        this.args = url.split('/');
    };

    

    /**
     * url查询参数
     */
    get searchParams() {

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

            value = [name, '=', value ? encode(value) : ''];

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
     * 获取当前session
     */
    get session() {
    
        return session.set(this);
    };


    /**
     * 创建新的session
     */
    set session(data) {
    
        let target = session.create(data);

        if (target)
        {
            let time = Date.now();

            this.setCookie('FSESSIONID', target.id, { httpOnly: true });
            this.setCookie('FSESSIONTAG', time + '.1', { httpOnly: true });

            target.cookTime = time / 60000 | 0;
        }
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

        response.setHeader('Location', url);
    
        // html
        if ((any = request.Accept) && any.indexOf('html') >= 0)
        {
            url = encodeURIComponent(url);
            this.send('html', `Redirecting to <a href="${url}">${url}</a>.`, 302);
        }
        else // text
        {
            this.send('text', `Redirecting to ${url}.`, 302);
        }
    };


    /**
     * 发送内容
     * @param {*} type 
     * @param {*} body 
     * @param {*} status 
     */
    send(type, body, status) {

        let response = this.response;
        let length;

        //无内容
        if (body == null || body === '')
        {
            response.statusCode = 204;
            response.end();
            return;
        }

        if (typeof body === 'string')
        {
            length = Buffer.byteLength(body);
        }
        else if (Buffer.isBuffer(body)) // buffer
        {
            length = body.length;
        }
        else //json
        {
            body = JSON.stringify(body);
            length = Buffer.byteLength(body);
        }

        response.setHeader('Content-Length', length);

        if (type)
        {
            switch (type)
            {
                case 'text':
                    type = 'text/plain charset=utf-8';
                    break;

                case 'html':
                    type = 'text/html charset=utf-8';
                    break;

                case 'json':
                    type = 'application/json charset=utf-8';
                    break;

                case 'xml':
                    type = 'text/xml charset=utf-8';
                    break;

                case 'bin':
                    type = 'application/octet-stream';
                    break;
            }

            response.setHeader('Content-Type', type);
        }

        response.statusCode = status || 200;
        response.end(body);
    };


};