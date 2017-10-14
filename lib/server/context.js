const querystring = require('querystring');

const Session = require('./session').Session;

const parse_cookie = require('../utils/cookie');



module.exports = class {



    constructor(request, response) {

        let url = request.url;
        let index = url.indexOf('?');

        this.request = request;
        this.response = response;
        this.session = new Session(this);

        if (index > 0)
        {
            this.search = url.substring(index + 1);
            url = url.substring(0, index);
        }

        //当前路由参数
        this.args = url.split('/');
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
            response.setHeader('Content-Type', value);
        }
    };

    
    //获取响应体
    get body() {

        return this.__body || '';
    };


    //设置响应体
    set body(value) {

        this.__body = value;
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




};