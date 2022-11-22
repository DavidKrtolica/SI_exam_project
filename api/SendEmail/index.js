const nodemailer = require("nodemailer");
module.exports = async function (context, req) {
    context.log('Starting processing email request.');

    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
        },
    });
    //context.log("transporter", transporter);
    //context.log("transporter", transporter.sendMail);
    let link = "https://authentication-service-si.azurewebsites.net/auth/acceptInvite?code=";
    const code = generateCode();
    link += code;
    //context.log(process.env.EMAIL, process.env.PASSWORD);
    saveCode(context, req.body.email, code);
    const mailOptions = {
        from: `"${process.env.NAME}" <${process.env.EMAIL}>`, // sender address
        to: req.body.email, // list of receivers
        subject: "You have been invited to join your friend's wishlist", // Subject line
        html: `<b>Hello ${req.body.email}</b><br><br>
        You have been invited by <b>${req.body.invitedBy}<b> to join their <b>${req.body.invitedTo}<b> wishlist.<br>
        If you wish to join, please click on the link below or copy it to your browser search bar and register:<br>
        <a href="${link}">${link}</a><br>
        Kind regards,<br>
        ${process.env.NAME}`, // html body
    };
    //context.log(mailOptions);
    let response;
    //original code that worked
    /*let info = await transporter.sendMail(mailOptions, (error, info) => {
        context.log("inside", info);
        if (error) {
            response = error;
            context.log("error", error);
        } else {
            response = "User successfully invited";
            context.log("response", response);
        }
        context.res = {
            // status: 200, /* Defaults to 200 */
         /*   body: response
        };
    });*/

      //test with then/catch
    transporter.sendMail(mailOptions)
        .then((info) => {
            context.log("inside", info);
            response = "User successfully invited";
            context.log("response", response);
        })
        .catch((error) => {
            response = error;
            context.log("error", error);
        });
    //context.log("info", info);
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: response
    };
}

function generateCode() {
    //uuid
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 20; i += 1) {
      code += characters[Math.floor(Math.random() * (characters.length - 1))];
    }
    return code;
}

function saveCode(context, email, code) {
    context.log("Connecting to database and saving the code");
}

