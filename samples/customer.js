const app = require('../lib');

module.exports = class extends app.Handler {


    async GET(context, next) {

        context.body = {};
    };

    
    async POST(context, next) {

        let value = await this.acceptData(context);

        context.body = value;
    };

    
    async PUT(context, next) {
        
        let value = await this.acceptData(context);

        context.body = value;
    };


    async DELETE(context, next) {

        let value = await this.acceptData(context);

        context.body = value;
    };

};