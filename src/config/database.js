const sql = require("mssql");
require("dotenv").config();

const config = {
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT),

    database: process.env.DB_DATABASE,

    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE === "true"
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("Conectado a SQL Server");
        return pool;
    })
    .catch(error => {
        console.error("Error conectando a SQL Server:");
        console.error(error);
        throw error;
    });

module.exports = {
    sql,
    poolPromise
};