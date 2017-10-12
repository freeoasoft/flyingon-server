
//最后处理插件
async function end() {

};



module.exports = class {
    


    /**
     * 注册前置处理插件
     */
    before(...args) {

        let array = this.__before;

        array.push.apply(array, args);

        return this;
    };


    /**
     * 注册后置处理插件
     */
    after(... args) {

        let array = this.__after;

        array.push.apply(array, args);
        
        return this;
    };


    //处理
    async __handle(context) {

        let response = context.response;

        let index = 1;
        let list = this.__plugins || this.__init_plugins();
        let any = list[index++];

        let next = any ? async () => {
            
            return any.call(this, context, (any = list[index++]) ? next : end);

        } : end;
        
        try
        {
            await list[0].call(this, context, next);
        }
        catch (e)
        {
            response.statusCode = 500;
            response.end();

            debugger
            //log
        }
    };


    //初始化plugins
    __init_plugins() {

        let list = [];
        let any;

        if (any = this.__before)
        {
            list.push.apply(list, any);
        }

        list.push(this.execute);
    
        if (any = this.__after)
        {
            list.push.apply(list, any);
        }

        for (let i = list.length - 1; i >= 0; i--)
        {
            if (typeof list[i] !== 'function')
            {
                list.splice(i, 1);
            }
        }

        return this.__plugins = list;
    };


    /**
     * 执行处理
     * @param {*} context 
     * @param {*} next 
     */
    async execute(context, next) {

        let fn = this[context.request.method];

        if (fn)
        {
            await fn.call(this, context, next);
        }
        else
        {
            let response = context.response;

            //不支持的method
            response.statusCode = 405;
            response.end();
        }
    };


};