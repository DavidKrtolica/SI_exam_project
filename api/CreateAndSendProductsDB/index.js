/*import { knexInstance as knex } from './db.js';
import {createTables} from './ddl.js';
import * as fs from 'fs';
import {send} from './ftp.js';*/
const getKnexInstance = require('./db')
const createTables = require('./ddl')
const fs = require('fs')
const util = require('util');
const send = require('./ftp')

//current inserted value into referenced table
let currentCategory, currentCategoryId, currentSubcategory, currentSubcategoryId, currentProductId;
let sizeId, colorId;
let insertedSize = {};
let insertedColor = {};
const productsFile = "products.db";
const path = "C:/home/";

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    const knex = getKnexInstance();
    if (fs.existsSync(`${path}${productsFile}`)) {
        fs.unlinkSync(`${path}${productsFile}`);
        context.log("Deleted file");
        /*try {
            fs.unlinkSync(`${path}${productsFile}`);
            context.log('Opening file.');
            const fd = await openAsync(`${path}${productsFile}`, 'r');
            context.log('Opened file.');
            fs.close(fd);
            context.log('Closed file and creating tables');
            //await createTables();
            context.log('Created tables.');
        } catch (err) {
            context.log.error('ERROR', err);
            // This rethrown exception will be handled by the Functions Runtime and will only fail the individual invocation
            throw err;
        }
        context.log('file created')
        //await createTables();*/
    }
    context.log('Create tables.');
    await createTables(context, knex);
    context.log('Insert basic.');
    await insertColorSize(context, knex);
    //context.log('req.body', req.body, req.body["data"], req.body.data)
    for (let i = 0; i < req.body.data.length; i++) {
        let product = req.body.data[i];
        //context.log("product, ", product);
        //insert category if not already in
        await insertCategory(product, knex);
    }
    await knex.destroy();
    await send(path, productsFile);
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: "done"
    };
}

async function insertColorSize(context, knex) {
    //insert color and size at the beginning
    try {
        await knex.insert({
            propertyName: 'color',
        })
        .returning('id')
        .into('propertyTypes')
        .then(function (id) {
            colorId = id;
        });
        await knex.insert({
            propertyName: 'size'
        })
        .returning('id')
        .into('propertyTypes')
        .then(function (id) {
            sizeId = id;
        });
    } catch (err) {
        context.log("ERROR", err)
    }
}

async function insertCategory(product, knex) {
    if (currentCategory !== product.category_name) {
        currentCategory = product.category_name;
        await knex.insert({
            categoryName: product.category_name,
        })
        .returning('id')
        .into('categories')
        .then(function (id) {
            currentCategoryId = id;
        });
    }
    await insertSubcategory(product, knex);
}

async function insertSubcategory(product, knex){
    if (currentSubcategory !== product.subcategory_name) {
        currentSubcategory = product.subcategory_name;
        await knex.insert({
            subcategoryName: currentSubcategory,
            categoryId: currentCategoryId
        })
        .returning('id')
        .into('subcategories')
        .then(function (id) {
            currentSubcategoryId = id;
        });
    }
    await insertProduct(product, knex);
}

async function insertProduct(product, knex){
    await knex.insert({
            productName: product.name,
            productDescription: product.description,
            price: product.price,
            link: product.link,
            overallRating: product.rating,
            image: product.img,
            alt: product.alt,
            categoryId: currentSubcategoryId
    })
    .returning('id')
    .into('products')
    .then(function (id) {
        currentProductId = id;
    });
    await insertColor(product, knex);
}

async function insertSpeficicColor(color, knex){
    if (!(color in insertedColor)){
        await knex.insert({
            value: color,
            propertyId: colorId
        })
        .returning('id')
        .into('propertyValues')
        .then(function (id) {
            insertedColor[color] = id;
        });
    }
}

async function insertColor(product, knex){
    if (product.color.length){
        //async had problems with map/foreach
        for (let i = 0; i < product.color.length; i++) {
            let color = product.color[i];
            //value not already in db
            await insertSpeficicColor(color, knex);
            //insert relationship into many to many
            await knex.insert({
                productId: currentProductId,
                propertyId: insertedColor[color]
            })
            .into('productHasProperties')
            .then();
        }
    }
    await insertSize(product, knex);
}

async function insertSpecificSize(size, knex) {
    if (!(size in insertedSize)){
        await knex.insert({
            value: size,
            propertyId: sizeId
        })
        .returning('id')
        .into('propertyValues')
        .then(function (id) {
            insertedSize[size] = id;
        });
    }
}

async function insertSize(product, knex){
    if (product.size.length) {
        for (let i = 0; i< product.size.length; i++) {
            size = product.size[i];
            //value not already in db
            await insertSpecificSize(size, knex);
            //insert relationship into many to many
            await knex.insert({
                productId: currentProductId,
                propertyId: insertedSize[size]
            })
            .into('productHasProperties')
            .then();
        }
    }
}
