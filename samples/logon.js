let date = new Date().toGMTString();



module.exports = async (context, next) => {
            
    await context.session.create({ a: 1, b: 2 });

    if (context.lastModified === date)
    {
        context.send(304);
    }
    else
    {
        let permisions = {};

        for (let i = 1; i < 1000; i++)
        {
            permisions['p' + i] = ['ABCD', 1, 'DEFG', 2];
        }

        context.body = {
            user: 'test',
            language: 'zh',
            permisions: permisions
        };

        context.lastModified = date;
    }
    
    await next();
};
