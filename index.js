import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs, resolvers } from './gql/gql.js';

const app = express();
const apolloServer = new ApolloServer({ typeDefs, resolvers });

await apolloServer.start();
apolloServer.applyMiddleware({ app });

app.listen({ port: 8080 }, () =>
   console.log(`🚀 Server ready at http://localhost:8080`)
);
