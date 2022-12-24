const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
const accessToken = +window.localStorage.getItem("accessToken") || "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE5NmFkY2U5OTk5YmJmNWNkMzBmMjlmNDljZDM3ZjRjNWU2NDI3NDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aC1zZXJ2aWNlLXNpIiwiYXVkIjoiYXV0aC1zZXJ2aWNlLXNpIiwiYXV0aF90aW1lIjoxNjY5NzQ2NTQ0LCJ1c2VyX2lkIjoiN1VsZzhrVnB5a1Z4R3lUZ09iVnNIV3BMdEpXMiIsInN1YiI6IjdVbGc4a1ZweWtWeEd5VGdPYlZzSFdwTHRKVzIiLCJpYXQiOjE2Njk3NDY1NDQsImV4cCI6MTY2OTc1MDE0NCwiZW1haWwiOiJ0ZXN0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdDFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.ZRGvAccCadkznCCXp514w86ZIcd7mjmU_jAM7oB_I5QMZc0P88CfIWRV6WlZOJPQLqfb0II4wVutQyKWbDQG36Z7nI0ENdHtNWJ8N2CyQtiWKieaiXn1EwEfP8GJybQPp2iEtArp7JaPcdmrCSOqXSBLFe8qd8cQ0TXAZmsT27yAs0voLN-xYXha0Dig-9s2rWB8y2OIIEUMu9SXrgLEF7x3mNPGTPRALTFNO0fKoFwrQsf66Jc_-66q_ymN4GRqIeeDe4zvzuDxAzqRG_Vn38skWl3hdL-LQz3kswfj_gSAeujDOK1adPA4_DawELKjO4XI3tcQGNsjz1HdpACFjw";

const connectSocketServer = () => {
  const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
  const accessToken = +window.localStorage.getItem("accessToken");
  return io(socketUrl, {
    extraHeaders: {
      Authorization: `Bearer ${accessToken || "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFmZjFlNDJlNDE0M2I4MTQxM2VjMTI1MzQwOTcwODUxZThiNDdiM2YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aC1zZXJ2aWNlLXNpIiwiYXVkIjoiYXV0aC1zZXJ2aWNlLXNpIiwiYXV0aF90aW1lIjoxNjcxODQ0NDM5LCJ1c2VyX2lkIjoiZ1o4eW5HdFc3RFE2cG1GTXV5MGVIMGdnd0R4MiIsInN1YiI6ImdaOHluR3RXN0RRNnBtRk11eTBlSDBnZ3dEeDIiLCJpYXQiOjE2NzE4NDQ0MzksImV4cCI6MTY3MTg0ODAzOSwiZW1haWwiOiJhQGFzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhQGFzLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.i43PkTwJs7SMhl_jpnFDEctlp4rcEjx8V3wq8OzhSQmbflcG1dwWgVJnFV0h0AOyUnq6dLHa2-GZU4K3OWwOp8oF2oqg5T4KHmYM7AWuLa6jB9Mp7PTwfYRd5pXb_7nFXXFGa9yLkYY4DR1hc5RXoMlwIsJBYqgEQjGSv_WCIBs7GOsdQ66JZyfUIOTIY96lg4A91he24eecO-4EkwmFfs4Y3NXnwUD1GTEI8ibGG2psPMDnqpau7KTwX8hCbZU5l4p62lKdkWMgaK1IM5soq9cUlWHZD1HblZ5M5G5RyEC9NqCl4oEex-yQye_MJnpwFY1OWh81tjpNWRxjA91wJw"}`
    }
  });
}

const getFriendsData = async () => {
  const socket = await connectSocketServer();
  console.log('socket = ', socket);
  socket.on('friends', (result) => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let wishlistId = params.id;
    const wishlistData = result.friends[wishlistId];
    console.log(wishlistData)
    document.querySelectorAll('.friend').forEach(e => e.remove());
    processFriendsData(wishlistData);
  })
}

//TODO: implement
const getWishlistData = async () => { }

getFriendsData();

const processFriendsData = (data) => {
  for (const property in data) {
    for (const friend of data[property]) {
      const friendsList = document.getElementById("friends-list");
      newLiElement = document.createElement("li");
      newText = document.createTextNode(`${friend.userEmail} - ${property}`);
      newLiElement.appendChild(newText);
      newLiElement.classList.add("list-group-item", 'friend');
      friendsList.appendChild(newLiElement);
    }
  }
}

// products and wl name
//TODO: implement
const processWishlistData = () => { }

const submitInvite = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  let wishlistId = params.id;
  const wishlistName = document.getElementById('wishlist-name').textContent;
  const emailTo = document.getElementById('form3Example3c').value;
  fetch('https://friends-si-exam.azurewebsites.net/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      wishlistId,
      wishlistName,
      emailTo,
    }),
  }).then((response) => {
    if (response.status !== 200) {
      const span = document.getElementById("invite-response-message");
      span.innerHTML = 'Something went wrong';
      throw new Error('An error occured');
    } else {
      const span = document.getElementById("invite-response-message");
      span.innerHTML = 'Success!';
      const friendsList = document.getElementById("friends-list");
      newLiElement = document.createElement("li");
      newText = document.createTextNode(`${emailTo} - notRegistered`);
      newLiElement.appendChild(newText);
      newLiElement.classList.add("list-group-item");
      friendsList.appendChild(newLiElement);
    }
  }).catch((e) => {
    console.log(e);
  });
}

