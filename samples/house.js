const app = require('../lib');

module.exports = class extends app.Handler {


    async GET(context, next) {

        next();
    };

    
    async POST(context, next) {

        next();
    };

    
    async PUT(context, next) {

        next();
    };


    async DELETE(context, next) {

        next();
    };

};