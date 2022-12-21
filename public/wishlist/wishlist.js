/*function submitCreateWishlist() {
    //const form = document.getElementById("new-wishlist-form");
    //form.wishlistName.value
    //ADD FUNCTIONALITY TO CREATE A NEW WISHLIST AND SAVE IT
}

function getWishlistsByUserId() {
    //FUNCTION WHICH FETCHES THE NECESSARY LIST OF WISHLISTS BY USER ID
    //AND POPULATES THE <ol> IN THE HTML "myWishlists"
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
}*/

//RETRIEVAL OF ACCESS AND REFRESH TOKEN STORED IN WINDOW.LOCALSTORAGE, CAN BE USED FOR ALL NECESSARY REQUESTS
console.log("ON WISHLIST PAGE, WITH TOKENS FROM LOCAL STORAGE: \n{\n  accessToken: "+window.localStorage.getItem("accessToken")+",\n  refreshToken: "+window.localStorage.getItem("refreshToken")+"\n}");