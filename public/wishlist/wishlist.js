const connectSocketServer = () => {
  const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
  return io(socketUrl, {
    extraHeaders: {
      Authorization: "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImE5NmFkY2U5OTk5YmJmNWNkMzBmMjlmNDljZDM3ZjRjNWU2NDI3NDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aC1zZXJ2aWNlLXNpIiwiYXVkIjoiYXV0aC1zZXJ2aWNlLXNpIiwiYXV0aF90aW1lIjoxNjY5NzQ2NTQ0LCJ1c2VyX2lkIjoiN1VsZzhrVnB5a1Z4R3lUZ09iVnNIV3BMdEpXMiIsInN1YiI6IjdVbGc4a1ZweWtWeEd5VGdPYlZzSFdwTHRKVzIiLCJpYXQiOjE2Njk3NDY1NDQsImV4cCI6MTY2OTc1MDE0NCwiZW1haWwiOiJ0ZXN0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdDFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.ZRGvAccCadkznCCXp514w86ZIcd7mjmU_jAM7oB_I5QMZc0P88CfIWRV6WlZOJPQLqfb0II4wVutQyKWbDQG36Z7nI0ENdHtNWJ8N2CyQtiWKieaiXn1EwEfP8GJybQPp2iEtArp7JaPcdmrCSOqXSBLFe8qd8cQ0TXAZmsT27yAs0voLN-xYXha0Dig-9s2rWB8y2OIIEUMu9SXrgLEF7x3mNPGTPRALTFNO0fKoFwrQsf66Jc_-66q_ymN4GRqIeeDe4zvzuDxAzqRG_Vn38skWl3hdL-LQz3kswfj_gSAeujDOK1adPA4_DawELKjO4XI3tcQGNsjz1HdpACFjw"
    }
  });
}

const submitCreateWishlist = async (wishlistName) => {
  const input = document.getElementById('form3Example3c').value;
  const socket = await connectSocketServer();
  socket.emit('createWishlist', ({ wishlistName: input }))
  socket.on('createWishlistSucceeded', () => {
    document.getElementById('message').innerHTML="Wishlist created!";
  })
  socket.on('createWishlistFailed', () => {
    document.getElementById('message').innerHTML="An error occurred.";
  })
}

function getWishlistsByUserId() {
  //FUNCTION WHICH FETCHES THE NECESSARY LIST OF WISHLISTS BY USER ID
  //AND POPULATES THE <ol> IN THE HTML "myWishlists"
}

function submitInvite() {
  const form = document.getElementById("invite-friend-form");
  //form.inviteEmail.value
  //FUNCTION EXECUTED WHEN A FRIEND IS INVITED BY EMAIL
  //FROM THE "wishlist" HTML PAGE FORM
}

function getWishlistsInvitees() {
  //SHOULD RETRIEVE ALL USERS ADDED TO A WISHLIST
  //INLCUDING THEIR STATUS (online, offline, not registered, invite sent)
  //AND POPULATES THE <ol> IN THE HTML "wishlist"
}

function getProductsByWishlistId() {
  //RETIRIEVEING ALL PRODUCTS CONNECTED TO A CERTAIN WISHLIST BY ID
  //AND POPULATES THE <ol> IN THE HTML "wishlist"
}

function submitInvite() {
  const form = document.getElementById("invite-friend-form");
  //form.inviteEmail.value
  //FUNCTION EXECUTED WHEN A FRIEND IS INVITED BY EMAIL
  //FROM THE "wishlist" HTML PAGE FORM
}

console.log("ON WISHLIST PAGE, WITH TOKENS FROM LOCAL STORAGE: \n{\n  accessToken: "+window.localStorage.getItem("accessToken")+",\n  refreshToken: "+window.localStorage.getItem("refreshToken")+"\n}");