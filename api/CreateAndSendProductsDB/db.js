//import knex from 'knex';
const knex = require('knex')

const DB_PATH = 'C:/home/products.db';

module.exports = function getKnexInstance() {
 return knex({
      client: 'sqlite3',
      connection: {
         filename: DB_PATH,
      },
      useNullAsDefault: true,
   });
}

/*module.exports = {
   knexInstance: knexInstance
}*/