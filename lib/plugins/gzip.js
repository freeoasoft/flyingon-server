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