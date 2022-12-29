//URL ENDPOINT FOR MAKING THE POST REQUEST TO THE EXPOSED AUTH_SERVICE (FOR NOW, OUR OWN)
const url = new URL("https://authentication-service-si.azurewebsites.net/auth/login");

//INVITE FRIENDS CODE QUERY PARAM
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
if(code != undefined) {
    url.searchParams.set('code', code);
}

//FETCH FUNCTION FOR EXECUTING THE POST REQUEST
function submitLogin() {
    const form = document.getElementById('login-form');
    fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "email": form.email.value,
            "password": form.password.value
        })
    })
    .then(response => response.json())
    .then(response => {
        if(response.status == 'Unauthorized') {
            alert("Error occured - "+response.description);    
        } else {
            window.localStorage.setItem("accessToken", response.data.accessToken);
            window.localStorage.setItem("refreshToken", response.data.refreshToken);
            //ADD FETCH WITH HEADER AUTH
            window.location.assign("/products");
        }
    });
};