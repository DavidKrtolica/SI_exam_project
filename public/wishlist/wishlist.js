const connectSocketServer = () => {
  const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
  const accessToken = window.localStorage.getItem("accessToken");
  return io(socketUrl, {
    extraHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

const getWishlistFriends = async () => {
  const socket = await connectSocketServer();
  socket.on('friends', (result) => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let wishlistId = params.id;
    const wishlistData = result.friends[wishlistId];
    document.querySelectorAll('.friend').forEach(e => e.remove());
    processFriendsData(wishlistData);
  })
}

const getWishlistDetails = async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  let wishlistId = params.id;
  return fetch('https://friends-si-exam.azurewebsites.net/get-wishlist-details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wishlistId,
    }),
  });
}

const getWishlistProducts = async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  let wishlistId = params.id;
  return fetch('https://friends-si-exam.azurewebsites.net/get-wishlist-products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wishlistId,
    }),
  });
}

const main = async () => {
  let [socket, wishlistDetailsResponse, wishlistProductsResponse] = await Promise.all([connectSocketServer(), getWishlistDetails(), getWishlistProducts()]);

  socket.on('friends', (result) => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let wishlistId = params.id;
    const wishlistData = result.friends[wishlistId];
    document.querySelectorAll('.friend').forEach(e => e.remove());
    processFriendsData(wishlistData);
  })

  try {
    // wishlist details
    if (wishlistDetailsResponse.status !== 200) {
      throw new Error('An error occured');
    } else {
      const data = await wishlistDetailsResponse.json();
      document.getElementById('wishlist-name').innerHTML = data.name;
      document.getElementById('created-at').innerHTML = new Date(data.created_at).toLocaleDateString();
      document.getElementById('user-email').innerHTML = data.user_email;
    }

    // products
    if (wishlistProductsResponse.status !== 200) {
      throw new Error('An error occured');
    } else {
      const data = await wishlistProductsResponse.json();
      for (const product of data) {
        const productsList = document.getElementById("products-list");
        newLiElement = document.createElement("li");
        newText = document.createTextNode(`${product.product_id}, ${product.size}, ${product.color}`);
        newLiElement.appendChild(newText);
        newLiElement.classList.add("list-group-item");
        productsList.appendChild(newLiElement);
      }
    }
  } catch (error) {

  }
}

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

main();