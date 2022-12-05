//import * as ftp from "basic-ftp"
const ftp = require('basic-ftp')

module.exports = async function send(path, fileName, context) {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: process.env.FTP_SECURE
        });
        //context.log(await client.list());
        await client.uploadFrom(`${path}${fileName}`, fileName);
    }
    catch(err) {
        context.log(err);
    }
    client.close();
}