import { knexInstance as knex } from './db.js';

export const fetchById = async (id) =>
   await knex.select('*').from('products').where('id', id).first();

export const fetchAll = async () => await knex.select('*').from('products');

export const insertProduct = async (product) => {
   try {
      await knex('products').insert(product);
      return true;
   } catch (error) {
      console.log(error);
      return false;
   }
};

export const updateProduct = async (id, product) => {
   try {
      await knex('products').update(product).where('id', id);
      return true;
   } catch (error) {
      console.log(error);
      return false;
   }
};
