import * as ftp from "basic-ftp"

export async function send(file) {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: process.env.FTP_SECURE
        });
        console.log(await client.list());
        await client.uploadFrom(`./${file}`, `./files/${file}`);
    }
    catch(err) {
        console.log(err);
    }
    client.close();
}