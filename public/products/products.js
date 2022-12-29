const CATEGORIES_QUERY = `query Categories {
   simpleCategories {
     name
   }
 }`;

const PRODUCTS_QUERY = `query Products($searchFilter: SearchFilter) {
   products(searchFilter: $searchFilter) {
      id
      name
      description
      link
      price
      rating
      category
      image {
        description
        id
        link
      }
   }
 }`;

const searchButton = document.getElementById('searchButton');
let searchTerm = document.getElementById('searchTerm');
let minPrice = document.getElementById('minPrice');
let maxPrice = document.getElementById('maxPrice');
const categoryButton = document.getElementById('categoryButton');
const ratingButton = document.getElementById('ratingButton');
let selectedCategory = null;
let selectedRating = null;

//let products;
const productsContainer = document.getElementById('productsContainer');

window.onload = async () => {
   //Adding available categories to the dropdown
   const categoriesQuery = await gqlRquest(CATEGORIES_QUERY);
   categoriesQuery.data.simpleCategories.map((category, index) => {
      const element = document.createElement('a');
      element.id = `category${index}`;
      element.classList.add('dropdown-item');
      element.href = '#';
      element.innerText = category.name;
      element.addEventListener('click', (e) => {
         selectedCategory = category.name;
         categoryButton.innerText = category.name;
      });
      categoryDropdownArea.appendChild(element);
   });
};

const categoryDropdownArea = document.getElementById('categoryDropdownArea');

const availableRatings = [1, 2, 3, 4, 5];
const ratingDropdownArea = document.getElementById('ratingDropdownArea');

availableRatings.map((rating, index) => {
   const element = document.createElement('a');
   element.id = `rating${index}`;
   element.classList.add('dropdown-item');
   element.href = '#';
   element.innerText = rating;
   element.addEventListener('click', (e) => {
      selectedRating = rating;
      ratingButton.innerText = rating;
   });
   ratingDropdownArea.appendChild(element);
});

const displayProducts = (products) => {
   for (let i = 0; i < products.length; i += 2) {
      const productRow = products.slice(i, i + 2);

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

         const category = document.createElement('h6');
         category.classList.add('card-subtitle');
         category.classList.add('mb-2');
         category.classList.add('text-muted');
         category.innerText = product.category;
         cardBody.appendChild(category);

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
         rating.innerText = `Rating: $${product.rating}`;
         ratingCol.appendChild(rating);

         const buttonsRow = document.createElement('div');
         buttonsRow.classList.add('row');
         cardBody.appendChild(buttonsRow);
         const wishlistCol = document.createElement('div');
         wishlistCol.classList.add('col');
         buttonsRow.appendChild(wishlistCol);
         const detailsCol = document.createElement('div');
         detailsCol.classList.add('col');
         buttonsRow.appendChild(detailsCol);

         const addButton = document.createElement('button');
         addButton.id = `addButton${i}`;
         addButton.classList.add('btn');
         addButton.classList.add('btn-outline-primary');
         addButton.type = 'button';
         addButton.innerText = 'Wishlist';
         wishlistCol.appendChild(addButton);

         const detailsButton = document.createElement('a');
         detailsButton.href = product.link;
         detailsButton.classList.add('btn');
         detailsButton.classList.add('btn-outline-success');
         detailsButton.innerText = 'Details';
         detailsCol.appendChild(detailsButton);
      });

      productsContainer.appendChild(row);
   }
};

searchButton.addEventListener('click', async (e) => {
   const searchFilter = {
      searchTerm: searchTerm.value || undefined,
      category: selectedCategory || undefined,
      minPrice: Number(minPrice.value) || undefined,
      maxPrice: Number(maxPrice.value) || undefined,
      minRating: selectedRating || undefined,
   };
   console.log('Send request with search filter: ', searchFilter);

   const query = await gqlRquest(PRODUCTS_QUERY, { searchFilter });
   productsContainer.innerHTML = '';
   displayProducts(query.data.products);
});
