import { knexInstance as knex } from './db.js';

export const fetchById = async (id) =>
   await knex.select('*').from('products').where('id', id).first();

export const fetchAll = async () => await knex.select('*').from('products');

export const fetch = async ({
   searchTerm,
   category,
   minPrice,
   maxPrice,
   minRating,
}) => {
   const query = knex.select('*').from('products');
   if (category) {
      query.where('category', category);
   }
   if (minPrice) {
      query.where('price', '>=', minPrice);
   }
   if (maxPrice) {
      query.where('price', '<=', maxPrice);
   }
   if (minRating) {
      query.where('rating', '>=', minRating);
   }
   if (searchTerm) {
      query.where((builder) => {
         builder.whereLike('name', `%${searchTerm}%`);
         builder.orWhereLike('description', `%${searchTerm}%`);
      });
   }
   return await query;
};

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

export const fetchImageByProductId = async (productId) => {
   return await knex
      .select('*')
      .from('products_images')
      .where('product_id', productId)
      .first();
};
