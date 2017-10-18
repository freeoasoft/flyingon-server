const parse = require('./parse');


let types = Object.create(null);

//查询参数标记
let queryTag;

//查询参数处理函数
let queryArg;



function queryValue(context, type, ...names) {

    let data = context[types[type]];
    let index = 0;
    let name;

    while (name = names[index++])
    {
        data = data[name];
    }

    return data;
};


//具名参数
function queryArg1(context, args, type, ...names) {

    let key = type + names.join('.');
    let value = args[key];

    if (value == null)
    {
        args.push(queryValue(context, type, ...names));
        args[key] = value = queryTag + 'f' + args.length;
    }
    
    return value;
};


//顺序参数
function queryArg2(context, args, type, ...names) {

    let key = type + names.join('.');
    let value = args[key];

    if (value == null)
    {
        args.push(queryValue(context, type, ...names));
        args[key] = value = queryTag + args.length;
    }
    
    return value;
};


//匿名参数
function queryArg3(context, args, type, ...names) {

    args.push(queryValue(context, type, ...names));
    return queryTag;
};


//编译
function compile(routes) {

    let list = ['return ['];
    let index = 0;

    for (let name in routes)
    {
        let items = routes[name].items;

        for (var j = 1, _ = items.length; j < _; j++)
        {
            let text = items[j++];

            if (text.indexOf('queryArg') > 0)
            {
                text = `function (context) {\n
let getQueryArg = queryArg;
let queryArgs = [];
return [\`${ text }\`, queryArgs];
}`;
            }
            else
            {
                text = `function (context) {\n
return [\`${ text }\`, null];
}`;
            }

            list.push(text, ',');
        }
    }

    if (list.length < 2)
    {
        return routes;
    }

    list.pop();
    list.push(']');
    
    list = new Function(['queryArg', 'CASE', 'WHERE'], list.join(''))(queryArg, CASE, WHERE);

    for (let name in routes)
    {
        let route = routes[name];
        let items = route.items;

        delete route.items;

        for (var j = 0, _ = items.length; j < _; j++)
        {
            let name = items[j++];
            (route[name] || (route[name] = [])).push(list[index++]);
        }
    }

    return routes;
};



function CASE(conditon, results) {

    return results[conditon] || results.default || '';
};


function WHERE(text) {

    return text ? ' where ' + text : '';
};



module.exports = function (text, options = {}) {
  
    let routes;
    let any;

    options.dbtype || (options.dbtype = 'postgresql');

    any = Object.create(null);

    any['#'] = options['#'] || 'context.paths';
    any['?'] = options['?'] || 'context.params';
    any['@'] = options['@'] || 'context.posts';

    options.types = any;

    types['#'] = any['#'].split('.')[1];
    types['?'] = any['?'].split('.')[1];
    types['@'] = any['@'].split('.')[1];
    
    if (!(any = options.paramType))
    {
        switch (options.dbtype)
        {
            case 'sqlserver':
                any = '@f';
                break;

            case 'mysql':
                any = '?';
                break;

            case 'oracle':
                any = ':f';
                break;

            case 'postgresql':
                any = '$0';
                break;

            default:
                any = '?';
                break;
        }
    }

    queryTag = any[0];

    switch (any[1])
    {
        case '0':
            queryArg = queryArg2;
            break;
        
        case '2':
            queryArg = queryArg1;
            break;

        default:
            queryArg = queryArg3;
            break;
    }

    routes = parse(text, options);
    compile(routes);

    return routes;
};