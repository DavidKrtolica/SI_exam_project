// console.log("ON WISHLIST PAGE, WITH TOKENS FROM LOCAL STORAGE: \n{\n  accessToken: "+window.localStorage.getItem("accessToken")+",\n  refreshToken: "+window.localStorage.getItem("refreshToken")+"\n}");

const accessToken = +window.localStorage.getItem("accessToken");

const connectSocketServer = () => {
  const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
  return io(socketUrl, {
    extraHeaders: {
      Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer accessToken`
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