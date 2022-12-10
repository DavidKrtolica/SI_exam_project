import { gql } from 'apollo-server-express';
import * as categoryData from '../db/categoryData.js';
import * as productData from '../db/productData.js';
// The graphql schema
export const typeDefs = gql`
   """
   Simple category type, as stored in the database.
   Mostly for use when the whole list of categories is needed without any interest in the category hierarchy.
   """
   type SimpleCategory {
      "The name of the category"
      name: String!
   }

   """
   Complex category type, gives the posibility to find the parent and direct descendent categories.
   With a proper nested query and correct cleanup in the client, the entire list of categories in nested hierarchical order can be obtained.
   """
   type Category {
      "The name of the category"
      name: String!
      "An array of direct descendant categories"
      subcategories: [Category]
      "The parent category"
      parent: Category
   }

   """
   A type representing the main properties of a product
   """
   type Product {
      "The id of the product"
      id: Int!
      "The name of the product"
      name: String
      "The description of the product"
      description: String
      "Link to where the product can be bought"
      link: String
      "The price of the product"
      price: Float
      "The average rating of the product"
      rating: Float
      "The name of the category of the product"
      category: String
      "Category object, can contain parent and direct descendents"
      detailedCategory: Category
      "An object containing information abou the image of the product"
      image: ProductImage
   }

   """
   A type representing the main properties of a product image
   """
   type ProductImage {
      "The id of the image"
      id: Int!
      "Link to where the image is stored"
      link: String
      "Description of the image, useful for alt text"
      description: String
      "The id of the product the image is linked to"
      product_id: Int!
   }

   """
   Input type that represents all the different search options when searching for a product
   """
   input SearchFilter {
      "Used to search in the name and description of the product with %searchTerm%"
      searchTerm: String
      "Find products matching the category"
      category: String
      "All returned products will be above (incl.) the minimum price"
      minPrice: Float
      "All returned products will be below (incl.) the minimum price"
      maxPrice: Float
      "All returned products will have a rating above (incl.) the minimum rating"
      minRating: Float
   }

   """
   All the available queries
   """
   type Query {
      "Used to get a list of all categories, just the name, as stored in the database"
      simpleCategories: [SimpleCategory]
      "Used to get a list of categories with parents and descendents. The query is meant to request nested categories in order to get all categories in hierarchical order"
      categories: [Category]
      "Get category by name"
      category(categoryName: String): Category
      "Get product by id"
      product(id: Int!): Product
      "Get a list of products. Optional search filter"
      products(searchFilter: SearchFilter): [Product]
   }
`;

//Resolvers for the types defined in the schema
export const resolvers = {
   Product: {
      image: (parent) => productData.fetchImageByProductId(parent.id),
      detailedCategory: (parent) => categoryData.fetchCategory(parent.category),
   },
   Category: {
      subcategories: (parent) =>
         categoryData.fetchSubategoriesByCategory(parent.name),
      parent: (parent) => categoryData.fetchParentCategory(parent.name),
   },
   Query: {
      simpleCategories: async () => {
         return await categoryData.fetchCategories();
      },
      categories: async () => {
         return await categoryData.fetchCategories();
      },
      category: async (_, { categoryName }) => {
         return await categoryData.fetchCategory(categoryName);
      },
      product: async (_, { id }) => {
         return await productData.fetchById(id);
      },
      products: async (_, { searchFilter }) => {
         return await productData.fetch(searchFilter);
      },
   },
   /*Mutation: {
      createProduct: (_, { input }) => productData.insertProduct(input),
      updateProduct: (_, { id, input }) => productData.updateProduct(id, input),
   },*/
};
