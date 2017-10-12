const app = require('../lib');

module.exports = class extends app.Handler {


    async GET(context, next) {

        context.send('json', {});
    };

    
    async POST(context, next) {

        context.send('json', {});
    };

    
    async PUT(context, next) {

        context.send('json', {});
    };


    async DELETE(context, next) {

        context.send('json', {});
    };

};