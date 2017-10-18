let types = Object.create(null);

let type;

let routes;

let route;



function parseQueryArg(text) {

    return text.replace(/\{([#?@])(\w+)\}\?/g, function (_, type, name) {

        name = name.split('.');
        name = name.length > 1 ? name.join('\', \'') : name[0];

        return '${getQueryArg(context, queryArgs, \'' + type + '\', \'' + name + '\')}';
    });
};


function URL(url, cache) {

    routes[url] = route = {
        url: url, 
        cache: cache,
        items: []
    };
};


function GET(text) {

    if (!route)
    {
        throw 'must call function "URL" before "GET"!'
    }

    route.items.push('GET', parseQueryArg(text));
};


function POST(text) {

    if (!route)
    {
        throw 'must call function "URL" before "POST"!'
    }

    route.items.push('POST', parseQueryArg(text));
};


function PUT(text) {

    if (!route)
    {
        throw 'must call function "URL" before "PUT"!'
    }

    route.items.push('PUT', parseQueryArg(text));
};


function DELETE(text) {

    if (!route)
    {
        throw 'must call function "URL" before "DELETE"!'
    }

    route.items.push('DELETE', parseQueryArg(text));
};


function IIF(condition, trueResult, falseResult) {

    if (condition && trueResult)
    {
        if (trueResult && trueResult[0] === '$' && trueResult[1] === '{')
        {
            trueResult = trueResult.slice(3, -2);
        }

        if (falseResult && falseResult[0] === '$' && falseResult[1] === '{')
        {
            falseResult = falseResult.slice(3, -2);
        }

        return `$\{ (${ types[condition] || condition }) ? \`${ trueResult }\` : \`${ falseResult || '' }\` }`;
    }

    throw 'IIF must two arguments and can not empty!';
};


function CASE(condition, results) {

    if (condition && results)
    {
        let list = ['{'];

        for (let name in results)
        {
            let text = results[name];

            if (text && text[0] === '$' && text[1] === '{')
            {
                list.push('\n\t\t', name, ': ', text.slice(3, -2), ',');
            }
            else
            {
                list.push('\n\t\t', name, ': `', results[name], '`', ',');
            }
        }

        list.pop();
        list.push('\n\t}');

        if (list[2])
        {
            return `$\{\n\tCASE(${ types[condition] || condition }, ${ list.join('') })\n}`;
        }

        throw 'CASE second argument must be a object!';
    }

    throw 'CASE must two arguments and can not empty!';
};


function JOIN(separator, ...args) {

    let length = args.length;

    if (length > 1)
    {
        let list = ['['];

        for (let i = 0; i < length; i++)
        {
            let text = args[i];

            if (text && text[0] === '$' && text[1] === '{')
            {
                list.push('\n\t\t', text.slice(3, -2), ', ');
            }
            else
            {
                list.push('\n\t\t`', text, '`', ', ');
            }
        }

        list.pop();
        list.push('\n\t]');

        return `$\{\n\t${ list.join('') }.join(\`${ separator || '' }\`)\n}`;
    }

    return length > 0 ? args[0] : '';
};


function FOR(target, text) {

    if (target && text)
    {
        let any;

        if (text[0] === '$' && text[1] === '{')
        {
            text = text.slice(3, -2);
        }

        //处理参数
        if (target.length > 1)
        {
            any = target.substring(1).split('.');
            any = any.length > 1 ? any.join('\', \'') : any[0];

            any = '${getQueryArg(context, queryArgs, ' + target[0] + ', \'' + any + '\', name)}';
        }
        else
        {
            any = '${getQueryArg(context, queryArgs, \'' + target + '\', name)}';
        }

        text = text.replace(/\{value\}\?/g, any);
        text = text.replace(/\{(name|value)\}/g, '${$1}');

        return `$\{
    (function (data) {

        let list = [];

        for (let name in data)
        {
            let value = data[name];
            list.push(\`${ text }\`);
        }

        return list.join(',');

    }).call(this, ${ types[target] || target })\n}`;
    }

    throw 'FOR must two arguments and can not empty!';
};


function WHERE(text) {

    if (!text)
    {
        return '';
    }

    if (text[0] === '$' && text[1] === '{')
    {
        text = text.slice(3, -2);
        return `$\{\n\tWHERE(${ text })\n}`;
    }

    return ' where ' + text;
};


function TYPE(values) {

    return values[type] || values.default || '';
};



/**
 * dbtype       数据库类型名称
 * text         配置文本
 * paramType    参数类型 1:命名参数 2:顺序参数 3:匿名参数
 */
module.exports = function (text, options) {

    let any;
    
    routes = Object.create(null);

    types = options.types;
    type = options.type;

    any = types;

    text = text.replace(/\{([#?@])(\w+)\}(?!\?)/g, function (_, type, name) {
        
        name = name.split('.');
        name = name.length > 1 ? name.join('\'][\'') : name[0];

        return any[type] + '[\\\'' + name + '\\\']';
    });

    any = new Function('URL,GET,POST,PUT,DELETE,IIF,CASE,JOIN,FOR,WHERE,TYPE'.split(','), text);
    any(URL, GET, POST, PUT, DELETE, IIF, CASE, JOIN, FOR, WHERE, TYPE);

    return routes;
};