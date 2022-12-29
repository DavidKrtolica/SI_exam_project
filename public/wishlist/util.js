//PERSISTING VERIFICATION FOR ACCESS TOKEN, SIMPLE
if(window.localStorage.getItem("accessToken") == null || window.localStorage.getItem("refreshToken") == null) {
    document.body.style.filter = "blur(2px)";
    document.body.style.pointerEvents = "none";
    window.location = "/login";
    alert("You haven been logged-out! Login again to access Your Wishlists...");
}

//NAVIGATION
function navigateToWishlist(e) {
    window.location = `/wishlist?id=${document.activeElement.id}`;
}

function navigate(route) {
    window.location = `/${route}`;
}

//LOGOUT AND DELETE TOKENS
function logout() {
    fetch("https://authentication-service-si.azurewebsites.net/auth/logout", {
        method: 'POST',
    })
    .then(response => response.json())
    .then(response => {
        if(response.status == 'Success') {
            window.localStorage.clear();
            window.location = "/login";  
            alert(response.desc); 
        } else {
            console.log("SOMETHING FAILED WHEN LOGGING OUT...")
        }
    });
}