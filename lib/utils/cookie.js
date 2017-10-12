/**
 * 解析cookie
 */
module.exports = text => {

    let cookies = {};

    if (text)
    {
        let list = text.match(/\=|[^=;\s]+/g);
        let decode = text.indexOf('%') >= 0 && decodeURIComponent;

        for (let i = list.length - 1; i >= 0; i--)
        {
            let value = list[i--];

            if (list[i--] !== '=')
            {
                continue;
            }
            
            //第一个值为"时去除引号
            if (value[0] === '"')
            {
                value = value.slice(1, -1);
            }
        
            //注:有同名时第一个值生效
            cookies[list[i]] = decode && value.indexOf('%') >= 0 ? decode(value) : value;
        }
    }

    return cookies;
};