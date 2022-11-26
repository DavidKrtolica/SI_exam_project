import { knexInstance as knex } from './db.js';

//Use this to create a products table with one entry in case products.db is missing

export function createTables() {
    console.log("here")
    knex.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('categoryName').unique();
    }).then();
    knex.schema.createTable('subcategories', (table) => {
        table.increments('id').primary();
        table.string('subcategoryName').unique();
        table.integer('categoryId');
        table.foreign('categoryId').references('id').inTable('categories');
    }).then();
    knex.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.string('productName');
        table.string('productDescription');
        table.float('price');
        table.string('link');
        table.float('overallRating');
        table.string('image');
        table.string('alt');
        table.integer('categoryId');
        table.foreign('categoryId').references('id').inTable('subcategories');
    }).then();
    knex.schema.createTable('propertyTypes', (table) => {
        table.increments('id').primary();
        table.string('propertyName').unique();
    }).then();
    knex.schema.createTable('propertyValues', (table) => {
        table.increments('id').primary();
        table.string('value').unique();
        table.integer('propertyId');
        table.foreign('propertyId').references('id').inTable('propertyTypes');
    }).then();
    knex.schema.createTable('productHasProperties', (table) => {
        table.increments('id').primary();
        table.integer('productId');
        table.integer('propertyId');
        table.foreign('propertyId').references('id').inTable('propertyValues');
        table.foreign('productId').references('id').inTable('products');
    }).then();
}