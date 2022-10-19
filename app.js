const FtpSrv = require('ftp-srv');

const port=21;
const options = {
    greeting: ["Connection to ftp server established"],
    url: "ftp://127.0.0.1:" + port,
    anonymous: 'SI-ftp', //username for anonymous session
    whitelist: ['USER', 'STOR', 'HELP', 'PORT', "QUIT"]
};
const ftpServer = new FtpSrv(options);

function simpleStringify (object){
    // stringify an object, avoiding circular structures
    // https://stackoverflow.com/a/31557814
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) == 'object'){
            continue;
        }
        if (typeof(object[prop]) == 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return JSON.stringify(simpleObject); // returns cleaned up JSON
};

ftpServer.on('login', ({ connection, username, password }, resolve, reject) => { 
    console.log(`connection ${connection}\n username ${username} \n password ${password}`);
    if(username === 'SI-ftp' && password === '@anonymous'){
        console.log("success");
        return resolve({ root:"./files/" });    
    }
    console.log("fail")
    return reject('Invalid username or password');
});

ftpServer.on('STOR', (error, fileName) => {
    console.log("here");
    if (error) {
        return 'Error';
    } else if (!fileName.match(/^|[\/\\]products\.db$/)) {
        return 'Invalid file name';
    } else {
        console.log("storing", fileName);
    }
 });

 ftpServer.on('PORT', (error, fileName) => {
    console.log(filename);
 });

 ftpServer.on('SEND', (error, fileName) => {
        console.log("storing2", fileName);
 });

 ftpServer.on ( 'client-error', (connection, context, error) =>{
    console.log('client error');
  console.log ( 'connection: ' +  connection, simpleStringify(connection) );
  console.log ( 'context: '    +  context );
  console.log ( 'error: '      +  error );
});

ftpServer.on('error', (err) => {
    console.log("**error**");
    console.log(err);
});

ftpServer.listen().then(() => { 
    console.log('Ftp server is starting...')
});