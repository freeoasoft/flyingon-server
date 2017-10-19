const SqlClient = require('./sqlclient');

let Pool;


class Connection {


    constructor(client) {

        this.__client = client;
    };


    async beginTransaction() {

        return await this.__client.query('BEGIN');
    };


    async commit() {

        return await this.__client.query('COMMIT');
    };


    async rollback() {

        return await this.__client.query('ROLLBACK');
    };


    async query(text, args) {

        let result = await this.__client.query(text, args);
        return result.rows;
    };


    close() {

        return this.__client.release()
    };

    
};



module.exports = class PostgreSQLClient extends SqlClient {


    constructor(settings) {

        super();
        this.pool = new (Pool || (Pool = require('pg').Pool))(settings);
    };


    //数据库名称
    get name() {
        
        return 'postgresql';
    };


    //参数化查询类型
    //1 匿名参数
    //2 顺序参数
    //3 具名参数
    get queryType() {
        
        return 2;
    };


    //参数化查询前缀
    get queryPrefix() {
        
        return '$';
    };



    async createConnection() {

        let client = await this.pool.connect();
        return new Connection(client);
    };
    

    async query(text, args) {

        let client = await this.pool.connect();

        try
        {
            let result = await client.query(text, args);
            return result.rows;
        }
        finally
        {
            client.release();
        }
    };


    async queryAll(list) {
        
        let client = await this.pool.connect();

        try
        {
            let results = [];
            let index = 0;
            let any;

            while (any = list[index++])
            {
                any = await client.query(any, list[index++]);
                results.push(any.rows);
            }

            return results;
        }
        finally
        {
            client.release();
        }
    };



};