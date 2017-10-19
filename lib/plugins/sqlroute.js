/**
 * 默认sql路由处理插件
 * @param {*} route 
 */
module.exports = (sqlclient, route) => {
    
    return async (context, next) => {

        await context.handleRoute(sqlclient, route);
        await next();
    };
    
};