const methods = Object.create(null);


methods.GET = async (context, next) => {

    context.body = {};
};


methods.POST = async (context, next) => {

    let value = await context.acceptData(context);

    context.body = value;
};


methods.PUT = async (context, next) => {
    
    let value = await context.acceptData(context);

    context.body = value;
};


methods.DELETE = async (context, next) => {

    let value = await context.acceptData(context);

    context.body = value;
};


module.exports = async (context, next) => {

    let fn = methods[context.request.method];

    if (fn)
    {
        await fn.call(this, context, next);
    }
    else
    {
        context.send(405);
    }
};