const submitCreateWishlist = async () => {
  const accessToken = window.localStorage.getItem("accessToken");

  const input = document.getElementById('form3Example3c').value;
  
  fetch('https://friends-si-exam.azurewebsites.net/create-wishlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken, wishlistName: input }),
  }).then(async (response) => {
    const result = await response.json();
    document.getElementById('message').innerHTML=`Wishlist with id ${result} created`;
  }).catch(() => {
    document.getElementById('message').innerHTML="An error occurred.";
  });
}