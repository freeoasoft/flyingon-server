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

    if (value && (value = +('0x' + value.split(':').join(''))))
    {
        value = value.toString('36');
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

    return [
        
        fn().toString(36).substring(2), //一次随机码 
        fn().toString(36).substring(2),  //二次随机码
        machine, //机器码
        Date.now().toString(36) //时间戳

    ].join('');
};