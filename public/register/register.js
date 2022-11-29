//URL ENDPOINT FOR MAKING THE POST REQUEST TO THE EXPOSED AUTH_SERVICE OF THE OTHER GROUP
//FOR NOW, WE ARE USING OUR OWN SERVICE HOSTED ON AZURE, SHOULD ALSO BE A SECRET/IN THE .ENV 
const url = new URL("https://authentication-service-si.azurewebsites.net/auth/register");

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
                //WHAT OTHER DATA DO WE WANT TO SAVE???
                //FOR FIREBASE, ONLY EMAIL AND PASSWORD NEEDED!
            })
        })
        .then(response => response.json())
        .then(response => {
            if(response.status == 'Failed') {
                alert("Error occured - "+response.description);    
            } else {
                //STATUS SUCCESS - WE GET USER ID AND EMAIL
                //console.log(JSON.stringify(response));
                window.location.assign("/login");
            }
            form.reset();
        });
    } else {
        alert("Passwords do not match!");
    }
};