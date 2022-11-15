import { gql } from 'apollo-server-express';
import * as productData from '../db/productData.js';

// The graphql schema
export const typeDefs = gql`
   type Product {
      id: ID!
      productName: String!
      productSubTitle: String
      mainCategory: String!
      subCategory: String
      price: Float!
      link: String!
      overallRating: Float
   }

   input CreateProductInput {
      productName: String!
      productSubTitle: String
      mainCategory: String!
      subCategory: String
      price: Float!
      link: String!
      overallRating: Float
   }

   input UpdateProductInput {
      productName: String
      productSubTitle: String
      mainCategory: String
      subCategory: String
      price: Float
      link: String
      overallRating: Float
   }

   type Query {
      product(id: ID!): Product!
      products: [Product]!
   }

   type Mutation {
      createProduct(input: CreateProductInput!): Boolean!
      updateProduct(id: ID!, input: UpdateProductInput!): Boolean!
   }
`;

// Resolvers for the types defined in the schema
export const resolvers = {
   Query: {
      product: (_, { id }) => productData.fetchById(id),
      products: () => productData.fetchAll(),
   },
   Mutation: {
      createProduct: (_, { input }) => productData.insertProduct(input),
      updateProduct: (_, { id, input }) => productData.updateProduct(id, input),
   },
};
