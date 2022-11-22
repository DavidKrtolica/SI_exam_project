const ftp = require("basic-ftp") 
require('dotenv').config();
// ESM: import * as ftp from "basic-ftp"

example()

async function example() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            secure: process.env.SECURE
        })
        console.log(await client.list())
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}