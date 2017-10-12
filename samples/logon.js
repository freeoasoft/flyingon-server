const app = require('../lib');

module.exports = class extends app.Handler {


    async execute(context, next) {

        context.session = { a: 1, b: 2 };
        
        context.send('json', {

            user: 'test',
            language: 'zh',
            permisions: {
                a: '1212',
                b: '1212'
            }
        });
        
        await next();
    };

    
};