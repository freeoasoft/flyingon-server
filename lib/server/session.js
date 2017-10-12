//本地session集合
const sessions = Object.create(null);

//uuid函数
const uuid = require('../utils/uuid');

//本地session集合数量
let count = 0;

//超时时间(分钟)
let timeout = 20;

//定时清除器
let timer;



//从缓存服务器更新session
async function pull(id) {

    let session = await test();

    return sessions[id] = session;
};


async function test() {
    
    return {};
};


//清除过期session
function clear() {

    let items = sessions;
    let keys = Object.keys(items);
    let date = Date.now;
    let time = timeout * 60000;
    let length = 0;

    timer = 0;

    for (let i = keys.length - 1; i >= 0; i--)
    {
        let name = keys[i];
        let item = items[name];

        if ((date - item.lastTime) > time)
        {
            length++;
            delete items[name];
        }
    }

    count -= length;
};

    

/**
 * Session类
 */
class Session {
    
    
    constructor(id, data) {

        this.id = id;
        this.version = 1;
        this.createTime = this.lastTime = this.cookieTime = Date.now();
        this.data = data || {};
    };


    /**
     * 保存session数据
     * @param {*} context 
     * @param {*} values
     */
    save(context, values) {

        this.version++;

        //同步至缓存服务器
    };


};

    

exports.init = settings => {
    
    let any = settings.timeout | 0;

    timeout = any > 1 ? any : 20;

};

    
exports.exist = id => {

    return sessions[id];
};


exports.get = async context => {

    let cookies = context.cookies;
    let id = cookies.FSESSIONID;
    let session;

    if (id && (session = sessions[id]))
    {
        let tag = cookies.FSESSIONTAG;
        
        tag = tag ? tag.split('.') : [0, 0];

        //如果版本号发生变化则从服务器更新session
        if (tag[1] !== session.version)
        {
            session = await pull(id);
        }

        let date = Date.now();
        let time = date / 60000 | 0;

        //检测是否超过
        if (time - tag[0] <= timeout)
        {
            session.lastTime = date;
    
            //如果距上次更新session的时间大于一分钟则更新session标记
            if (time - session.cookTime > 1)
            {
                session.cookTime = time;
                context.setCookie('FSESSIONTAG', time + '.' + session.version, { httpOnly: true });
            }
    
            return session.data;
        }
    
        delete sessions[id];
    }

    return false;
};


exports.create = data => {

    let id = uuid();
    let session = sessions[id] = new Session(id, data);

    //数量超过指定数量则清除过期session
    if (count++ > 1000 && !timer)
    {
        timer = setTimeout(clear, 10000);
    }

    return session;
};
