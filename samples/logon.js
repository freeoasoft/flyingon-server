const app = require('../lib');


module.exports = class extends app.Handler {


    async execute(context, next) {

        await context.session.create({ a: 1, b: 2 });

        let value = await context.session.get('a');

        await context.session.set('a', 'ddd');

        value = await context.session.get('a');

        await context.session.remove('a');

        value = await context.session.get('a');


        
        context.body = {
            user: 'test',
            language: 'zh',
            permisions: {
                a: '1212',
                b: '1212'
            }
        };
        
        await next();
    };

    
};