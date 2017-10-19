const sqlroute = require('../sqlroute/compile');



module.exports = class SqlClient {



    //数据库名称
    get name() {
        
        return 'unkown';
    };


    //参数化查询类型
    //1 匿名参数
    //2 顺序参数
    //3 具名参数
    get queryType() {
        
        return 1;
    };


    //参数化查询前缀
    get queryPrefix() {
        
        return '?';
    };



    async createConnection() {

        throw 'subclass does not override this method!';
    };
    

    async query(text, args) {

        throw 'subclass does not override this method!';
    };


    async queryAll(list) {
        
        throw 'subclass does not override this method!';
    };



    /**
     * 初始化redis
     * @param {*} settings 
     */
    async initRedis(settings) {

        await (this.__redis = new (require('redis-await'))(settings.redis)).ready();
    };

    
    /**
     * 获取或设置缓存数据
     * @param {*} url 
     * @param {*} key 
     * @param {*} value 
     */
    async cache(url, key, value) {

        let redis = this.__redis;

        if (redis)
        {
            if (value === void 0)
            {
                return await redis.hget('d:' + url, key);
            }

            await redis.hset('d:' + url, key, value); //清除缓存数据
            await redis.hset('v:' + url, key, value = Date.now()); //设置新的版本号

            return value;
        }
        else
        {
            throw 'database redis cache not set!';
        }
    };


    /**
     * 获取缓存版本版本号
     * @param {*} url 
     * @param {*} key 
     */
    async version(url, key) {

        let redis = this.__redis;

        if (redis)
        {
            return await redis.hget('v:' + url, key);
        }
        else
        {
            throw 'database redis cache not set!';
        }
    };


    /**
     * 清除缓存
     * @param {*} url 
     * @param {*} key 
     */
    async clear(url) {

        let redis = this.__redis;

        if (redis)
        {
            return await redis.del('d:' + url, 'v:' + url);
        }
        else
        {
            throw 'database redis cache not set!';
        }
    };



    /**
     * 加载sql路由配置
     * @param {*} text 
     */
    loadRoutes(text) {

        return sqlroute(this, text);
    };



};