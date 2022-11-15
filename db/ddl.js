import { knexInstance as knex } from './db.js';

//Use this to create a products table with one entry in case products.db is missing

knex.schema
   .hasTable('products')
   .then((exists) => {
      if (!exists) {
         return knex.schema
            .createTable('products', (table) => {
               table.increments('id').primary();
               table.string('productName');
               table.string('productSubTitle');
               table.string('mainCategory');
               table.string('subCategory');
               table.float('price');
               table.string('link');
               table.float('overallRating');
            })
            .then(() => {
               console.log("Table 'Products' created");

               knex('products')
                  .insert({
                     productName: 'Arturia MicroFreak',
                     mainCategory: 'Instruments',
                     subCategory: 'Synthesizers',
                     price: '2490',
                     link: 'https://www.thomann.de/intl/arturia_microfreak.htm',
                     overallRating: '4.7',
                  })
                  .then(() => {
                     knex
                        .select('*')
                        .from('products')
                        .then((data) => console.log(data));
                  });
            })
            .catch((error) => {
               console.log(`There was an error creating the table: ${error}`);
            });
      } else {
         console.log("Table 'Products' already exists");
      }
   })
   .then(() => {
      console.log('Done! 🙌');
   })
   .catch((error) => {
      console.log(`There was an error setting up the database: ${error}`);
   });
