import { knexInstance as knex } from './db.js';

//Use this to create a products table with one entry in case products.db is missing

function createTables() {
    knex.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('categorytName');
    })
    knex.schema.createTable('subcategories', (table) => {
        table.increments('id').primary();
        table.string('subcategorytName');
        table.integer('categoryId');
        table.foreign('categoryId').references('id').inTable('categories')
    })
    knex.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.string('productName');
        table.string('productDescription');
        table.float('price');
        table.string('link');
        table.float('overallRating');
        table.string('image');
        table.string('alt');
        table.integer('categoryId')
        table.foreign('categoryOd').references('id').inTable('subcategories')
    })
    knex.schema.createTable('propertyTypes', (table) => {
        table.increments('id').primary();
        table.string('propertyName');
    })
    knex.schema.createTable('propertyValues', (table) => {
        table.increments('id').primary();
        table.string('value');
        table.integer('propertyId');
        table.foreign('propertyId').references('id').inTable('propertyTypes')
    })
    knex.schema.createTable('productHasProperties', (table) => {
        table.increments('id').primary();
        table.integer('productId');
        table.integer('propertyId');
        table.foreign('propertyId').references('id').inTable('propertyValues')
        table.foreign('productId').references('id').inTable('products')
    })
}