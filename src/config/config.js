require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logQueryParameters: true,
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      connectTimeout: 3000,
    },
  },
};
