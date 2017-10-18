module.exports = (route, pool) => {
    

    const methods = Object.create(null);


    methods.GET = async (context, list) => {

        // 同步创建连接
        var connect = await pool.connect();

        try
        {
            let body = [];

            for (let i = 0, l = list.length; i < l; i++)
            {
                let item = list[i](context);
                let value = await connect.query(item[0], item[1]);

                body.push(value.rows);
            }

            if (body.length < 2)
            {
                body = body[0];
            }

            context.body = body;
        }
        finally
        {
            connect.release()
        }
    };
    

    methods.POST = methods.PUT = methods.DELETE = async (context, list) => {

        let value = await context.acceptData();
                        
        context.posts = value ? JSON.parse(value) : {};

        // 同步创建连接
        let connect = await pool.connect();

        try
        {
            let body = [];

            for (let i = 0, l = list.length; i < l; i++)
            {
                let item = list[i](context);
                let value = await connect.query(item[0], item[1]);

                body.push(value.rows);
            }

            if (body.length < 2)
            {
                body = body[0];
            }

            context.body = body;
        }
        finally
        {
            connect.release()
        }
    };


    return async (context, next) => {

        let method = context.request.method;
        let list = route[method];
        let fn;

        if (list && (fn = methods[method]))
        {
            if (list[0])
            {
                return await fn(context, list);
            }

            context.send(500, 'not config method ' + method);
        }
        else
        {
            context.send(405);
        }
    };
    
};