import knex from 'knex';

const DB_PATH = './products.db';

export const knexInstance = knex({
   client: 'sqlite3',
   connection: {
      filename: DB_PATH,
   },
   useNullAsDefault: true,
});