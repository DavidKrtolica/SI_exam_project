//URL ENDPOINT FOR MAKING THE POST REQUEST TO THE EXPOSED AUTH_SERVICE (FOR NOW, OUR OWN)
const url = new URL("https://authentication-service-si.azurewebsites.net/auth/register");

//INVITE FRIENDS CODE QUERY PARAM 
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
if(code != undefined) {
    url.searchParams.set('code', code);
}

//FETCH FUNCTION FOR EXECUTING THE POST REQUEST
function submitRegister() {
    const form = document.getElementById('register-form');
    if(form.password.value == form.repeatpassword.value) {
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
            if(response.status == 'Failed') {
                alert("Error occured - "+response.description);    
            } else {
                window.location.assign("/login");
            }
            form.reset();
        });
    } else {
        alert("Passwords do not match!");
    }
};