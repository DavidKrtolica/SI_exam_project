import { knexInstance as knex } from './db.js';

//Use this to create a products table with one entry in case products.db is missing

function insertData(data) {
    //current inserted value into referenced table
    let currentCategory, currentCategoryId, currentSubcategory, currentSubcategoryId, currentProductId
    let sizeId, colorId;
    let insertedSize = {}
    let insertedColor = {}
    //insert color and size at the beginning
    knex.insert({
        propertyName: 'color',
    })
    .returning('id')
    .into('propertyTypes')
    .then(function (id) {
        colorId = id
    });
    knex.insert({
        propertyName: 'size',
    })
    .returning('id')
    .into('propertyTypes')
    .then(function (id) {
        sizeId = id
    });
    for (product in data) {
        //insert category if not already in
        if (currentCategory && currentCategory !== product.category_name) {
            currentCategory = product.category_name
            knex.insert({
                categoryName: currentCategory,
            })
            .returning('id')
            .into('categories')
            .then(function (id) {
                currentCategoryId = id
            });
        }
        //insert subcategory if not already in
        if (currentSubcategory && currentSubcategory !== product.subcategory_name) {
            currentSubcategory = product.subcategory_name
            knex.insert({
                subcategoryName: currentSubcategory,
                categoryId: currentCategoryId
            })
            .returning('id')
            .into('subcategories')
            .then(function (id) {
                currentSubcategoryId = id
            });
        }
        knex.insert({
            subcategoryName: currentSubcategory,
            categoryId: currentCategoryId
        })
        .returning('id')
        .into('subcategories')
        .then(function (id) {
            currentSubcategoryId = id
        });
    }
    //insert main product
    knex.insert({
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
    });
    for (color in product.color) {
        //value not already in db
        if (!insertedColor[color]){
            knex.insert({
                value: color,
                propertyId: colorId
            })
            .returning('id')
            .into('propertyValues')
            .then(function (id) {
                insertedColor[color] = id
            });
        }
        //insert relationship into many to many
        knex('productHasProperties')
            .insert({
                productId: currentProductId,
                propertyId: insertedColor[color]
            })
    }
    for (size in product.size) {
    //value not already in db
        if (!insertedSize[size]){
            knex.insert({
                value: size,
                propertyId: sizeId
            })
            .returning('id')
            .into('propertyValues')
            .then(function (id) {
                insertedSize[size] = id
            });
        }
        //insert relationship into many to many
        knex('productHasProperties')
            .insert({
                productId: currentProductId,
                propertyId: insertedSize[size]
            })
    }
}