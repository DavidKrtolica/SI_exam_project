//import { knexInstance as knex } from './db.js';
//const knex = require('./db').knexInstance
//Use this to create a products table with one entry in case products.db is missing

module.exports = async function createTables(context, knex) {
    //console.log("here")
    context.log('Creating tables.');
    if (! (await knex.schema.hasTable('categories')) ) {
        await knex.schema.createTable('categories', (table) => {
            table.increments('id').primary();
            table.string('categoryName').unique();
        }).then();
    }
    if (! (await knex.schema.hasTable('subcategories')) ) {
        await knex.schema.createTable('subcategories', (table) => {
            table.increments('id').primary();
            table.string('subcategoryName').unique();
            table.integer('categoryId');
            table.foreign('categoryId').references('id').inTable('categories');
        }).then();
    }
    if (! (await knex.schema.hasTable('products')) ) {
        await knex.schema.createTable('products', (table) => {
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
    }
    if (! (await knex.schema.hasTable('propertyTypes')) ) {
        await knex.schema.createTable('propertyTypes', (table) => {
            table.increments('id').primary();
            table.string('propertyName').unique();
        }).then();
    }
    if (! (await knex.schema.hasTable('propertyValues')) ) {
        await knex.schema.createTable('propertyValues', (table) => {
            table.increments('id').primary();
            table.string('value').unique();
            table.integer('propertyId');
            table.foreign('propertyId').references('id').inTable('propertyTypes');
        }).then();
    }
    if (! (await knex.schema.hasTable('productHasProperties')) ) {
        await knex.schema.createTable('productHasProperties', (table) => {
            table.increments('id').primary();
            table.integer('productId');
            table.integer('propertyId');
            table.foreign('propertyId').references('id').inTable('propertyValues');
            table.foreign('productId').references('id').inTable('products');
        }).then();
    }
    context.log('Created tables.');
}