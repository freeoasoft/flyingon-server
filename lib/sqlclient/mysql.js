const SqlClient = require('./sqlclient');

let mysql;



async function getConnection(pool) {

    return new Promise((resolve, reject) => {

        pool.getConnection((err, client) => {

            if (err)
            {
                client.release();
                return reject(err);
            }

            resolve(client);
        });
    });    
};


async function query(client, text, args) {

    return new Promise((resolve, reject) => {

        client.query(text, args, function (err, results, fields) {

            if (err)
            {
                return reject(err);
            }

            resolve(results);
        });
    });
};


class Connection {


    constructor(client) {

        this.__client = client;
    };


    async beginTransaction() {

        return new Promise((resolve, reject) => {

            this.__client.beginTransaction(function(err) {

                if (err) 
                { 
                    reject(err);
                }

                resolve();
            });

        });
    };


    async commit() {

        return new Promise((resolve, reject) => {

            this.__client.commit(function(err) {

                if (err) 
                { 
                    reject(err);
                }

                resolve();
            });

        });
    };


    async rollback() {

        return new Promise((resolve, reject) => {

            this.__client.rollback(function(err) {

                if (err) 
                { 
                    reject(err);
                }

                resolve();
            });

        });
    };


    async query(text, args) {

        return await query(this.__client, text, args);
    };


    close() {

        return this.__client.release()
    };

    
};



module.exports = class MySQLClient extends SqlClient {



    constructor(settings) {

        super();
        this.pool = (mysql || (mysql = require('mysql'))).createPool(settings);
    };



    //数据库名称
    get name() {
        
        return 'mysql';
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

        let client = await getConnection(this.pool);
        return new Connection(client);
    };
    

    async query(text, args) {

        let client = await getConnection(this.pool);

        try
        {
            return await query(client, text, args);
        }
        finally
        {
            client.release();
        }
    };


    async queryAll(list) {
        
        let client = await getConnection(this.pool);

        try
        {
            let results = [];
            let index = 0;
            let any;

            while (any = list[index++])
            {
                any = await query(client, any, list[index++]);
                results.push(any);
            }

            return results;
        }
        finally
        {
            client.release();
        }
    };



};