const url = "https://authentication-service-si.azurewebsites.net/auth/login"
async function submitLogin() {
    await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "email": "dk@email.com",
            "password": "dk123456789"
        })
    })
    .then(response => response.json())
    .then(response => console.log(JSON.stringify(response)));
}