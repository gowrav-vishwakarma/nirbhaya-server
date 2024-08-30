require('dotenv').config();

module.exports = {
  development: {
    username: '',
    password: '',
    host: '',
    database: 'process.env.DB_DATABASE',
    port: process.env.DB_PORT,
    dialect: 'mysql',

    logQueryParameters: true,
    dialectOptions: {
      // "useUTC": false, //for reading from database
      dateStrings: true,
      typeCast: true,
      connectTimeout: 3000,
    },
    // timezone: '+05: 30',
    // define: {
    // hooks: {
    // beforeBulkUpdate: (m) => {
    //   let conditions = JSON.parse(JSON.stringify(Object.keys(m.where)));
    //   conditions = conditions.filter((i) => i != "status");
    //   if (conditions.length == 0) {
    //     throw new Error(
    //       "Bulk update with no specific conditions, status is not considered"
    //     );
    //   }
    // },
    // beforeBulkDestroy: (m) => {
    //   if (m.model.getTableName() != "homeShopCarts" || Object.keys(m.where).length == 0) {
    //     throw new Error("Bulk Destroy is disabled");
    //   }
    // },
    // },
    // },
  },
};
