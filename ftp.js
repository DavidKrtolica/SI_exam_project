import * as ftp from "basic-ftp"

export async function send(file) {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "",
            user: "",
            password: "",
            secure: false
        })
        console.log(await client.list())
        await client.uploadFrom(`./${file}`, `./files/${file}`)
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}