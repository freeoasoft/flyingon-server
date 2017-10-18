//本地session集合
const sessions = Object.create(null);

//uuid函数
const uuid = require('../utils/uuid');

//本地session集合数量
let count = 0;


//超时时间(毫秒)
let timeout = 1200000;

//本地缓存最大数量
let max = 1000;


//redis缓存
let redis;


//定时清除器
let timer;




/**
 * 初始化session配置
 */
exports.init = settings => {
    
    let any = settings.timeout | 0;

    timeout = (any > 1 ? any | 0 : 20) * 60000;

    any = settings.max;
    max = any > 100 ? any | 0 : 100;

    if (settings.cache === 'redis')
    {
        redis = new (require('redis-await'))(settings.redis || {});
        redis.ready();
    }
};



/**
 * 检查指定context的session是否有效
 */
exports.check = async context => {

    let cookies = context.cookies;
    let id = cookies.FSESSIONID;

    if (id)
    {
        let time1 = Date.now();
        let [time2, version] = (cookies.FSESSIONTAG || '0.0').split('.');

        //检测是否超过
        if ((time2 = time1 - time2) > timeout)
        {
            sessions[id] = null;
            return false;
        }

        let session = sessions[id];

        //如果版本号发生变化则从服务器更新session
        if (!session || (version |= 0) !== session[''])
        {
            if (version = await redis.hget(id, ''))
            {
                sessions[id] = { '': version };
            }
            else
            {
                return false;
            }
        }

        //如果间隔时间大于两分钟则更新cookie时间戳
        if (time2 > 120000)
        {
            context.setCookie('FSESSIONTAG', time1 + '.' + version, { httpOnly: true });

            //更新redis过期时间
            await redis.expire(id, timeout / 1000 | 0 + 300);
        }

        context.session.id = id;

        return true;
    }

    return false;
};



/**
 * Session类
 */
exports.Session = class {


    constructor(context) {

        this.context = context;
    };


    /**
     * 创建新的session
     */
    async create(data) {
        
        //数量超过指定数量则清除缓存
        if (count++ > max)
        {
            sessions = Object.create(null);
        }

        let context = this.context;
        let id = this.id = uuid();

        if (data)
        {
            data[''] = 1;
        }
        else
        {
            data = { '': 1 };
        }

        sessions[id] = data;

        //session id
        context.setCookie('FSESSIONID', id, { httpOnly: true });

        //session tag: 时间戳+版本号
        context.setCookie('FSESSIONTAG', Date.now() + '.1', { httpOnly: true });

        //推送至redis
        await redis.hmset(id, data);
                    
        //更新redis过期时间
        await redis.expire(id, timeout / 1000 | 0 + 300);
    };
    

    /**
     * 获取指定名称的session值
     */
    async get(name) {

        if (name === '')
        {
            return '';
        }

        let session = sessions[this.id];
        
        if (!session)
        {
            throw 'no logon. session can not be accessed!';
        }

        return name in session ? session[name] : await redis.hget(this.id, name);
    };


    /**
     * 设置session值
     */
    async set(name, value) {

        if (name !== '')
        {
            let session = sessions[this.id];
            
            if (!session)
            {
                throw 'no logon. session can not be accessed!';
            }

            session[name] = value;
            await redis.hset(this.id, name, value);

            return true;
        }

        return false;
    };


    /**
     * 移除批定名称的session值
     */
    async remove(name) {

        if (name !== '')
        {
            let session = sessions[this.id];
            
            if (!session)
            {
                throw 'no logon. session can not be accessed!';
            }

            delete session[name];
            await redis.hdel(this.id, name);

            return true;
        }

        return false;
    };


};