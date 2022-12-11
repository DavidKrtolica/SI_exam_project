import { knexInstance as knex } from './db.js';

export const fetchCategories = async () => {
   return await knex.select('*').from('categories');
};

export const fetchCategory = async (categoryName) => {
   return await knex
      .select('*')
      .from('categories')
      .where('name', categoryName)
      .first();
};

export const fetchSubategoriesByCategory = async (categoryName) => {
   const result = await knex
      .select(`subcategory as name`)
      .from('subcategories')
      .where('category', categoryName);

   return result;
};

export const isCategoryRoot = async (categoryName) => {
   const result = await knex
      .count()
      .from('subcategories')
      .where('subcategory', categoryName)
      .first();

   const isRoot = Number(result['count(*)']) === 0 ? true : false;
   return isRoot;
};

export const fetchParentCategory = async (categoryName) => {
   const result = await knex
      .select('category as name')
      .from('subcategories')
      .where('subcategory', categoryName)
      .first();
   return result;
};
