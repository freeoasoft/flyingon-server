module.exports = function (seconds) {
    
    seconds = seconds >= 0 ? seconds : 43200;

    return async function (context, next) {

        let response = context.response;

        await next();

        if (!response.headersSent)
        {
            let date = new Date();

            date.setSeconds(date.getSeconds() + seconds);

            response.setHeader('Cache-Control', 'max-age=' + seconds);
            response.setHeader('Expires', date.toGMTString());
        }
    };

};