import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { sequelizeModelArray } from '../src/app.module';
import { Suggestion } from '../src/models/Suggestion';
import { UserOrder } from '../src/models/UserOrder';

const syncModels = [...sequelizeModelArray, Suggestion, UserOrder];

async function syncDatabase() {
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    models: syncModels,
    logging: console.log,
    timezone: '+05:30',
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      multipleStatements: true,
    },
  });

  try {
    await sequelize.authenticate();
    console.log('Connected to database:', process.env.DB_NAME);
    await sequelize.sync();
    console.log('Database synced successfully.');
  } finally {
    await sequelize.close();
  }
}

syncDatabase().catch((error) => {
  console.error('Database sync failed:', error);
  process.exit(1);
});
