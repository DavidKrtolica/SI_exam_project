//URL ENDPOINT FOR MAKING THE POST REQUEST TO THE EXPOSED AUTH_SERVICE OF THE OTHER GROUP
//FOR NOW, WE ARE USING OUR OWN SERVICE HOSTED ON AZURE, SHOULD ALSO BE A SECRET/IN THE .ENV 
const url = "https://authentication-service-si.azurewebsites.net/auth/login";

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
            //console.log(JSON.stringify(response));
            //console.log(response);
            //STATUS SUCCESS - WE GET ACCESS AND REFRESH TOKEN
            console.log("THIS IS HOW YOU ACCESS THE ACCESS TOKEN: "+response.data.accessToken);
            console.log("THIS IS HOW YOU ACCESS THE REFRESH TOKEN: "+response.data.refreshToken);
        }
    });
};