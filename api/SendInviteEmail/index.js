const nodemailer = require("nodemailer");

module.exports = async function(context, mySbMsg) {
    context.log('JavaScript ServiceBus queue trigger function processed message', mySbMsg);
    ontext.log('Node.js ServiceBus queue trigger function processed message', myQueueItem);
    context.log('EnqueuedTimeUtc =', context.bindingData.enqueuedTimeUtc);
    context.log('DeliveryCount =', context.bindingData.deliveryCount);
    context.log('MessageId =', context.bindingData.messageId);
    
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    let link = `https://authentication-service-si.azurewebsites.net/auth/acceptInvite?code=${mySbMsg.code}`;
    const mailOptions = {
        from: `"${process.env.NAME}" <${process.env.EMAIL}>`, // sender address
        to: mySbMsg.emailTo, // list of receivers
        subject: "You have been invited to join your friend's wishlist", // Subject line
        html: `<b>Hello ${mySbMsg.emailTo}</b><br><br>
        You have been invited by <b>${mySbMsg.invitedBy}<b> to join their <b>${mySbMsg.wishlistName}<b> wishlist.<br>
        If you wish to join, please click on the link below or copy it to your browser search bar and register:<br>
        <a href="${link}">${link}</a><br>
        Kind regards,<br>
        ${process.env.NAME}`, // html body
    };
    let response;
    let info = await transporter.sendMail(mailOptions, (error, info) => {
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
            body: response
        };
    });

};