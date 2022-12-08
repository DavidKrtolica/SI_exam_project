import { gql } from 'apollo-server-express';
import * as categoryData from '../db/categoryData.js';
import * as productData from '../db/productData.js';
// The graphql schema
export const typeDefs = gql`
   type SimpleCategory {
      name: String!
   }

   type Category {
      name: String!
      subcategories: [Category]
      parent: Category
   }

   type Product {
      id: Int!
      name: String
      description: String
      link: String
      price: Float
      rating: Float
      category: String
      detailedCategory: Category
      image: ProductImage
   }

   type ProductImage {
      id: Int!
      link: String
      description: String
      product_id: Int!
   }

   input SearchFilter {
      searchTerm: String
      category: String
      minPrice: Float
      maxPrice: Float
      minRating: Float
   }

   type Query {
      simpleCategories: [SimpleCategory]
      categories: [Category]
      category(categoryName: String): Category
      product(id: Int!): Product
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
