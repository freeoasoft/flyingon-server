/**
 * 根据物理网卡地址及时间生成唯一标识
 */


 //随机函数
 const random = Math.random;


 //机器码
 const machine = (() => {

    //取最大的mac地址
    let keys = require('os').networkInterfaces();
    let value = '';

    for (let key in keys)
    {
        let item = keys[key][0];
        
        if ((key = item.mac) > value)
        {
            value = key;
        }
    }

    if (value)
    {
        value = value.split(':').join('');
        value = new Buffer(value, 'hex').toString('base64');
    }
    else //取不到max则生成一个8位长度的随机码
    {
        value = new Buffer(random().toString(16).substring(2), 'hex').toString('base64')
        value = value.length > 8 ? value.substring(0, 8) : value.padEnd(8, '0');
    }

    return value;

})();


module.exports = () => {

    let fn = random;

    let value = new Buffer([
        
        fn().toString(16).substring(2), //一次随机码 
        fn().toString(16).substring(2),  //二次随机码
        Date.now().toString(16) //时间戳

    ].join(''), 'hex').toString('base64');

    value += machine;

    let length = value.length;

    if (length === 32)
    {
        return value;
    }

    if (length > 32)
    {
        return value.substring(length - 32, 32);
    }

    return value.padEnd(32, '0');
};