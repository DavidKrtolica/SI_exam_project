import { knexInstance as knex } from './api/CreateAndSendProductsDB/db.js';
import {createTables} from './api/CreateAndSendProductsDB/ddl.js';
import {send} from './ftp.js';
import * as fs from 'fs';

//Use this to create a products table with one entry in case products.db is missing
 //current inserted value into referenced table
let currentCategory, currentCategoryId, currentSubcategory, currentSubcategoryId, currentProductId
let sizeId, colorId;
let insertedSize = {}
let insertedColor = {}

async function insertColorSize() {
    //insert color and size at the beginning
    await knex.insert({
        propertyName: 'color',
    })
    .returning('id')
    .into('propertyTypes')
    .then(function (id) {
        colorId = id
        //console.log('0. color inserted')
    });
    await knex.insert({
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
            .into('productHasProperties').then()
            //.then(() => console.log('4.1 many to many color inserted', insertedColor, currentProductId, insertedColor[color]))
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
    await knex.destroy()
    await send("products.db")
} 

insertData([
    {"name": "TP-Link Tapo C320WS", "category_name": "Hjem & husholdning", "subcategory_name": "Smart home", "rating": "4,3", "link": "https://www.pricerunner.dk:443/pl/589-3200822964/Overvaagningskameraer/TP-Link-Tapo-C320WS-Sammenlign-Priser", "price": "399\u00a0kr.", "description": "2560x1440 (QHD/2K), Punkt, Mobilt netv\u00e6rk, Ethernet, WiFi, Bev\u00e6gelsesdetektor, Tilh\u00f8rende mobilapp, Google Home, Amazon Alexa", "img": "https://www.pricerunner.dk/product/40x40/3003571638/TP-Link-Tapo-C320WS.jpg?ph=true", "alt": "TP-Link Tapo C320WS", "color": [], "size": []},
    {"name": "Philips Hue Tap Dial Switch EU", "category_name": "Hjem & husholdning", "subcategory_name": "Smart home", "rating": null, "link": "https://www.pricerunner.dk:443/pl/1577-3201754923/Intelligente-hjem/Philips-Hue-Tap-Dial-Switch-EU-Sammenlign-Priser", "price": "290\u00a0kr.", "description": "Bluetooth, Zigbee, Batteri", "img": "https://www.pricerunner.dk/product/40x40/3005163716/Philips-Hue-Tap-Dial-Switch-EU.jpg?ph=true", "alt": "Philips Hue Tap Dial Switch EU", "color": ["Hvid", "Sort"], "size": []},
    {"name": "Philips Hue 1x Smart Plug EU", "category_name": "Hjem & husholdning", "subcategory_name": "Smart home", "rating": "4,5", "link": "https://www.pricerunner.dk:443/pl/1577-5043155/Intelligente-hjem/Philips-Hue-1x-Smart-Plug-EU-Sammenlign-Priser", "price": "159\u00a0kr.", "description": "Bluetooth, Zigbee, Elnet", "img": "https://www.pricerunner.dk/product/40x40/1906942726/Philips-Hue-1x-Smart-Plug-EU.jpg?ph=true", "alt": "Philips Hue 1x Smart Plug EU", "color": [], "size": []},
    {"name": "HyperX SoloCast", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "4,6", "link": "https://www.pricerunner.dk:443/pl/176-3200013800/Mikrofoner/HyperX-SoloCast-Sammenlign-Priser", "price": "418\u00a0kr.", "description": "Mikrofon", "img": "https://www.pricerunner.dk/product/40x40/3006622654/HyperX-SoloCast.jpg?ph=true", "alt": "HyperX SoloCast", "color": ["Hvid", "Sort"], "size": []},
    {"name": "Blue Microphones Yeti X", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "4,6", "link": "https://www.pricerunner.dk:443/pl/176-5059024/Mikrofoner/Blue-Microphones-Yeti-X-Sammenlign-Priser", "price": "889\u00a0kr.", "description": "Mikrofon", "img": "https://www.pricerunner.dk/product/40x40/3006623144/Blue-Microphones-Yeti-X.jpg?ph=true", "alt": "Blue Microphones Yeti X", "color": [], "size": []},
    {"name": "Nordic OnAir", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "4,0", "link": "https://www.pricerunner.dk:443/pl/176-3200253039/Mikrofoner/Nordic-OnAir-Sammenlign-Priser", "price": "279\u00a0kr.", "description": "Mikrofon", "img": "https://www.pricerunner.dk/product/40x40/3002345508/Nordic-OnAir.jpg?ph=true", "alt": "Nordic OnAir", "color": [], "size": []},
    {"name": "Shure MV7", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "5,0", "link": "https://www.pricerunner.dk:443/pl/176-3200005728/Mikrofoner/Shure-MV7-Sammenlign-Priser", "price": "1.640\u00a0kr.", "description": "Mikrofon", "img": "https://www.pricerunner.dk/product/40x40/3000686623/Shure-MV7.jpg?ph=true", "alt": "Shure MV7", "color": ["Sort", "S\u00f8lv"], "size": []},
    {"name": "R\u00d8DE PSA1", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "4,9", "link": "https://www.pricerunner.dk:443/pl/176-5124576/Mikrofoner/ROEDE-PSA1-Sammenlign-Priser", "price": "549\u00a0kr.", "description": "Mikrofonstativ", "img": "https://www.pricerunner.dk/product/40x40/3000118253/ROEDE-PSA1.jpg?ph=true", "alt": "R\u00d8DE PSA1", "color": [], "size": []},
    {"name": "Blue Microphones Yeti", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "4,6", "link": "https://www.pricerunner.dk:443/pl/176-3749365/Mikrofoner/Blue-Microphones-Yeti-Sammenlign-Priser", "price": "639\u00a0kr.", "description": "Mikrofon", "img": "https://www.pricerunner.dk/product/40x40/1871027541/Blue-Microphones-Yeti.jpg?ph=true", "alt": "Blue Microphones Yeti", "color": ["Bl\u00e5", "Gr\u00e5", "Hvid", "R\u00f8d", "Sort", "S\u00f8lv"], "size": []},
    {"name": "HyperX QuadCast", "category_name": "Lyd & billede", "subcategory_name": "Studie- & optageudstyr", "rating": "4,6", "link": "https://www.pricerunner.dk:443/pl/176-4884710/Mikrofoner/HyperX-QuadCast-Sammenlign-Priser", "price": "599\u00a0kr.", "description": "Mikrofon", "img": "https://www.pricerunner.dk/product/40x40/1871531364/HyperX-QuadCast.jpg?ph=true", "alt": "HyperX QuadCast", "color": [], "size": []},
])