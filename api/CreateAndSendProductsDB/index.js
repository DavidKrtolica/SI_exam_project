import { knexInstance as knex } from './db.js';
import {createTables} from './ddl.js';
import * as fs from 'fs';
import {send} from './ftp.js';

//current inserted value into referenced table
let currentCategory, currentCategoryId, currentSubcategory, currentSubcategoryId, currentProductId;
let sizeId, colorId;
let insertedSize = {};
let insertedColor = {};

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (!fs.existsSync('./products.db')) {
        createTables();
    }
    await insertColorSize();
    for (let i = 0; i < req.body.data.length; i++) {
        let product = req.body.data[i];
        //insert category if not already in
        await insertCategory(product);
    }
    await knex.destroy();
    await send("products.db");
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}


async function insertColorSize() {
    //insert color and size at the beginning
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
}

async function insertCategory(product) {
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
    await insertSubcategory(product);
}

async function insertSubcategory(product){
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
    await insertProduct(product);
}

async function insertProduct(product){
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
    await insertColor(product);
}

async function insertSpeficicColor(color){
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

async function insertColor(product){
    if (product.color.length){
        //async had problems with map/foreach
        for (let i = 0; i < product.color.length; i++) {
            let color = product.color[i];
            //value not already in db
            await insertSpeficicColor(color);
            //insert relationship into many to many
            await knex.insert({
                productId: currentProductId,
                propertyId: insertedColor[color]
            })
            .into('productHasProperties')
            .then();
        }
    }
    await insertSize(product);
}

async function insertSpecificSize(size) {
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

async function insertSize(product){
    if (product.size.length) {
        for (let i = 0; i< product.size.length; i++) {
            size = product.size[i];
            //value not already in db
            await insertSpecificSize(size);
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
