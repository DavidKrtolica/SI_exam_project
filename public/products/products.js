const searchButton = document.getElementById('searchButton');
let searchTerm = document.getElementById('searchTerm');
let minPrice = document.getElementById('minPrice');
let maxPrice = document.getElementById('maxPrice');
const categoryButton = document.getElementById('categoryButton');
let selectedCategory = null;

//Adding available categories to the dropdown
const availableCategories = ['First', 'Second', 'Third', 'Fourth'];
const categoryDropdownArea = document.getElementById('categoryDropdownArea');

availableCategories.map((category, index) => {
   const element = document.createElement('a');
   element.id = `category${index}`;
   element.classList.add('dropdown-item');
   element.href = '#';
   element.innerText = category;
   element.addEventListener('click', (e) => {
      selectedCategory = category;
      categoryButton.innerText = category;
   });
   categoryDropdownArea.appendChild(element);
});

searchButton.addEventListener('click', (e) => {
   const searchFilter = {
      searchTerm: searchTerm.value,
      category: selectedCategory,
      minPrice: minPrice.value,
      maxPrice: maxPrice.value,
   };
   console.log('Send request with search filter: ', searchFilter);
});
