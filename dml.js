import { knexInstance as knex } from './db.js';
import {createTables} from './ddl.js';
import * as fs from 'fs';

//Use this to create a products table with one entry in case products.db is missing
 //current inserted value into referenced table
let currentCategory, currentCategoryId, currentSubcategory, currentSubcategoryId, currentProductId
let sizeId, colorId;
let insertedSize = {}
let insertedColor = {}

function insertColorSize() {
    //insert color and size at the beginning
    knex.insert({
        propertyName: 'color',
    })
    .returning('id')
    .into('propertyTypes')
    .then(function (id) {
        colorId = id
        //console.log('0. color inserted')
    });
    return knex.insert({
        propertyName: 'size',
    })
    .returning('id')
    .into('propertyTypes')
    .then(function (id) {
        sizeId = id
        //console.log('0. size inserted')
    });
}

async function insertCategory(product) {
    if (currentCategory !== product.category_name) {
        //console.log('1. inside 1 if',currentCategory,product.category_name )
        currentCategory = product.category_name
        await knex.insert({
            categoryName: product.category_name,
        })
        .returning('id')
        .into('categories')
        .then(function (id) {
            currentCategoryId = id
            //console.log('1. category inserted',product.category_name, id)
        });
    }
    await insertSubcategory(product)
}

async function insertSubcategory(product){
    if (currentSubcategory !== product.subcategory_name) {
        //console.log('2. inside 2 if',currentSubcategory,product.subcategory_name)
        currentSubcategory = product.subcategory_name
        await knex.insert({
            subcategoryName: currentSubcategory,
            categoryId: currentCategoryId
        })
        .returning('id')
        .into('subcategories')
        .then(function (id) {
            currentSubcategoryId = id
            //console.log('2. subcategory inserted', currentSubcategory, id)
        });
    }
    await insertProduct(product)
}

async function insertProduct(product){
    //console.log('3. product insert')
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
        currentProductId = id
        //console.log('3. product inserted', product, id)
    });
    await insertColor(product)
}

async function insertSpeficicColor(color){
    //console.log("insert specific color, ", ! color in insertedColor, !(color in insertedColor))
    if (!(color in insertedColor)){
        await knex.insert({
            value: color,
            propertyId: colorId
        })
        .returning('id')
        .into('propertyValues')
        .then(function (id) {
            insertedColor[color] = id
            //console.log(color, '4. specific color inserted', id)
        });
    }
}

async function insertColor(product){
    if (product.color.length){
        //console.log('4. inside 3 if')
        //async had problems with map/foreach
        for (let i = 0; i < product.color.length; i++) {
            let color = product.color[i]
            //value not already in db
            //console.log("!color in insertedColor", !color in insertedColor)
            await insertSpeficicColor(color)
            //insert relationship into many to many
            await knex.insert({
                productId: currentProductId,
                propertyId: insertedColor[color]
            })
            .into('productHasProperties')
            .then(() => console.log('4.1 many to many color inserted', insertedColor, currentProductId, insertedColor[color]))
        }
    }
    await insertSize(product)
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
            insertedSize[size] = id
            //console.log('5. specific size inserted', size, id)
        });
    }
}

async function insertSize(product){
    if (product.size.length) {
        //console.log('5. inside 4 if')
        for (let i = 0; i< product.size.length; i++) {
            size = product.size[i]
            //value not already in db
            await insertSpecificSize(size)
            //insert relationship into many to many
            await knex.insert({
                productId: currentProductId,
                propertyId: insertedSize[size]
            })
            .into('productHasProperties')
            .then()
            //.then(() => console.log('5.1 many to many size inserted', currentProductId, insertedSize[size]))
        }
    }
}

async function insertData(data) {
    if (!fs.existsSync('./products.db')) {
        createTables()
    }
    //console.log('insert')
    await insertColorSize()
    //let counter =0
    for (let i = 0; i < data.length; i++) {
        let product = data[i];
        //insert category if not already in
        //counter++
        //console.log("New product:", counter)
        //console.log("product ", counter, " insertCategory")
        await insertCategory(product)
        //console.log('6. done')
    }
    //console.log('7. done insert')
} 