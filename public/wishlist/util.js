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