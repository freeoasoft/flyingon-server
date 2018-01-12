const parse = require('./parse');


//查询参数前缀
let queryPrefix;

//查询参数处理函数
let queryArg;



function queryValue(context, type, ...names) {

    let index = 0;
    let data;
    let name;

    switch (type)
    {
        case '#':
            data = context.params;
            break;

        case '?':
            data = context.query;
            break;

        default:
            data = context.post;
            break;
    }

    while (name = names[index++])
    {
        data = data[name];
    }

    return data;
};


//匿名参数
function queryArg1(context, args, type, ...names) {

    args.push(queryValue(context, type, ...names));
    return queryPrefix;
};


//顺序参数
function queryArg2(context, args, type, ...names) {

    let key = type + names.join('.');
    let value = args[key];

    if (value == null)
    {
        args.push(queryValue(context, type, ...names));
        args[key] = value = queryPrefix + args.length;
    }
    
    return value;
};


//具名参数
function queryArg3(context, args, type, ...names) {

    let key = type + names.join('.');
    let value = args[key];

    if (value == null)
    {
        args.push(queryValue(context, type, ...names));
        args[key] = value = queryPrefix + 'f' + args.length;
    }
    
    return value;
};


//编译
function compile(sqlclient, routes) {

    let list = [];
    let items = [];
    let index = 0;
    let item, any;

    for (let name in routes)
    {
        if (item = routes[name])
        {
            for (name in item)
            {
                if ((any = name[0]) >= 'A' && any <= 'Z' && (any = item[name]) && any.length > 0)
                {
                    items.push(...any);
                }
            }
        }
    }

    if (!items.length)
    {
        return;
    }

    any = '\v\v\v\v\v\v\v\v';

    items = items.join(any).replace(/\{([#?@])(\w+)\}\?/g, function (_, type, name) {

        name = name.split('.');
        name = name.length > 1 ? name.join('\', \'') : name[0];

        return '${getQueryArg(context, queryArgs, \'' + type + '\', \'' + name + '\')}';

    }).split(any);

    list.push('return [');

    while (item = items[index++])
    {
        if (item.indexOf('getQueryArg') > 0)
        {
            item = `\n\nfunction (context) {\n
let getQueryArg = queryArg;
let queryArgs = [];
return [\`${ item }\`, queryArgs];
}\n\n`;
        }
        else
        {
            item = `\n\nfunction (context) {\n
return [\`${ item }\`, null];
}`;
        }

        list.push(item, ',\n\n');
    }

    list.pop();
    list.push(']');
    
    list = new Function(['queryArg', 'CASE', 'WHERE'], list.join(''))(queryArg, CASE, WHERE);
    index = 0;

    for (let name in routes)
    {
        if (item = routes[name])
        {
            for (name in item)
            {
                if ((any = name[0]) >= 'A' && any <= 'Z' &&
                    (any = item[name]) && (any = any.length) > 0)
                {
                    if (any > 1)
                    {
                        item[name] = compile_list(list.slice(index, any));
                        index += any;
                    }
                    else
                    {
                        item[name] = list[index++];
                    }
                }
            }
        }
    }
};


function compile_list(list) {

    return context => {

        let results = [];
        let items = list;
        let index = 0;
        let fn;

        while (fn = items[index++])
        {
            results.push(...fn(context));
        }

        return results;
    };
};



function CASE(conditon, results) {

    return results[conditon] || results.default || '';
};


function WHERE(text) {

    return text ? ' where ' + text : '';
};



module.exports = function (sqlclient, text) {
  
    let routes;

    queryPrefix = sqlclient.queryPrefix;

    switch (sqlclient.queryType)
    {
        case 1:
            queryArg = queryArg1;
            break;

        case 2:
            queryArg = queryArg2;
            break;

        default:
            queryArg = queryArg3;
            break;
    }

    routes = parse(sqlclient, text);

    compile(sqlclient, routes);

    return routes;
};