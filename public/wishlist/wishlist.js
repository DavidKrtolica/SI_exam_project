const connectSocketServer = () => {
   const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
   const accessToken = window.localStorage.getItem('accessToken');
   return io(socketUrl, {
      extraHeaders: {
         Authorization: `Bearer ${accessToken}`,
      },
   });
};

const getWishlistFriends = async () => {
   const socket = await connectSocketServer();
   socket.on('friends', (result) => {
      const params = new Proxy(new URLSearchParams(window.location.search), {
         get: (searchParams, prop) => searchParams.get(prop),
      });
      let wishlistId = params.id;
      const wishlistData = result.friends[wishlistId];
      document.querySelectorAll('.friend').forEach((e) => e.remove());
      processFriendsData(wishlistData);
   });
};

const getWishlistDetails = async () => {
   const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
   });
   let wishlistId = params.id;
   return fetch(
      'https://friends-si-exam.azurewebsites.net/get-wishlist-details',
      {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            wishlistId,
         }),
      }
   );
};

const getProducts = async (productIds) => {
   const PRODUCTS_QUERY = `query Products($productIds: [ID]) {
    products(productIds: $productIds) {
      description
      id
      image {
        link
        id
      }
      link
      name
      price
      rating
    }
  }`;

   const query = await gqlRequest(PRODUCTS_QUERY, { productIds });
   return query.data.products;
};

const getWishlistProducts = async () => {
   const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
   });
   let wishlistId = params.id;
   return fetch(
      'https://friends-si-exam.azurewebsites.net/get-wishlist-products',
      {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            wishlistId,
         }),
      }
   );
};

const main = async () => {
   let [socket, wishlistDetailsResponse, wishlistProductsResponse] =
      await Promise.all([
         connectSocketServer(),
         getWishlistDetails(),
         getWishlistProducts(),
      ]);

   socket.on('friends', (result) => {
      const params = new Proxy(new URLSearchParams(window.location.search), {
         get: (searchParams, prop) => searchParams.get(prop),
      });
      let wishlistId = params.id;
      const wishlistData = result.friends[wishlistId];
      document.querySelectorAll('.friend').forEach((e) => e.remove());
      processFriendsData(wishlistData);
   });

   try {
      // wishlist details
      if (wishlistDetailsResponse.status !== 200) {
         throw new Error('An error occured');
      } else {
         const data = await wishlistDetailsResponse.json();
         document.getElementById('wishlist-name').innerHTML = data.name;
         document.getElementById('created-at').innerHTML = new Date(
            data.created_at
         ).toLocaleDateString();
         document.getElementById('user-email').innerHTML = data.user_email;
      }

      // products
      if (wishlistProductsResponse.status !== 200) {
         throw new Error('An error occured');
      } else {
         const wishlistProducts = await wishlistProductsResponse.json();
         const productIds = wishlistProducts.map((product) =>
            Number(product.product_id)
         );
         const products = await getProducts(productIds);
         const productsList = document.getElementById('products-list');
         for (let i = 0; i < products.length; i += 3) {
            const productRow = products.slice(i, i + 3);

            const row = document.createElement('div');
            row.classList.add('row');
            row.classList.add('mb-3');

            productRow.map((product) => {
               const col = document.createElement('div');
               col.classList.add('col');
               row.appendChild(col);

               const card = document.createElement('div');
               card.classList.add('card');
               card.style = 'width: 18rem';
               col.appendChild(card);

               const img = document.createElement('img');
               img.src = product.image.link;
               img.classList.add('card-img-top');
               card.appendChild(img);

               const cardBody = document.createElement('div');
               cardBody.classList.add('card-body');
               card.appendChild(cardBody);

               const name = document.createElement('h5');
               name.classList.add('card-title');
               name.innerText = product.name;
               cardBody.appendChild(name);

               const description = document.createElement('p');
               description.classList.add('card-text');
               description.innerText = product.description;
               cardBody.appendChild(description);

               const priceRatingRow = document.createElement('div');
               priceRatingRow.classList.add('row');
               cardBody.appendChild(priceRatingRow);
               const priceCol = document.createElement('div');
               priceCol.classList.add('col');
               priceRatingRow.appendChild(priceCol);
               const ratingCol = document.createElement('div');
               ratingCol.classList.add('col');
               priceRatingRow.appendChild(ratingCol);

               const price = document.createElement('h6');
               price.classList.add = 'card-text';
               price.innerText = `Price: $${product.price}`;
               priceCol.appendChild(price);

               const rating = document.createElement('h6');
               rating.classList.add = 'card-text';
               rating.innerText = `Rating: ${product.rating}`;
               ratingCol.appendChild(rating);

               const detailsButton = document.createElement('a');
               detailsButton.href = product.link;
               detailsButton.classList.add('btn');
               detailsButton.classList.add('btn-outline-success');
               detailsButton.innerText = 'Details';
               cardBody.appendChild(detailsButton);
            });

            productsList.appendChild(row);
         }
      }
   } catch (error) {}
};

const processFriendsData = (data) => {
   for (const property in data) {
      for (const friend of data[property]) {
         const friendsList = document.getElementById('friends-list');
         newLiElement = document.createElement('li');
         newText = document.createTextNode(`${friend.userEmail} - ${property}`);
         newLiElement.appendChild(newText);
         newLiElement.classList.add('list-group-item', 'friend');
         friendsList.appendChild(newLiElement);
      }
   }
};

const submitInvite = () => {
   const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
   });
   let wishlistId = params.id;
   const wishlistName = document.getElementById('wishlist-name').textContent;
   const emailTo = document.getElementById('form3Example3c').value;
   const accessToken = window.localStorage.getItem('accessToken');
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
   })
      .then((response) => {
         if (response.status !== 200) {
            const span = document.getElementById('invite-response-message');
            span.innerHTML = 'Something went wrong';
            throw new Error('An error occured');
         } else {
            const span = document.getElementById('invite-response-message');
            span.innerHTML = 'Success!';
            const friendsList = document.getElementById('friends-list');
            newLiElement = document.createElement('li');
            newText = document.createTextNode(`${emailTo} - notRegistered`);
            newLiElement.appendChild(newText);
            newLiElement.classList.add('list-group-item');
            friendsList.appendChild(newLiElement);
         }
      })
      .catch((e) => {
         console.log(e);
      });
};

main();
