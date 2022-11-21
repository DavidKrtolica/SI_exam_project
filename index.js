import express from 'express';
import {
   ApolloServer
} from 'apollo-server-express';
import {
   typeDefs,
   resolvers
} from './gql/gql.js';
import {
   BlobServiceClient
} from '@azure/storage-blob';

const app = express();
const apolloServer = new ApolloServer({
   typeDefs,
   resolvers
});

await apolloServer.start();
apolloServer.applyMiddleware({
   app
});

/**
 * @param  {} '/'
 * @param  {} (req
 * @param  {} res
 */
app.post('/products-update-webhook', async (req, res) => {
   const header = req.get("Aeg-Event-Type");
   if (header && header === 'SubscriptionValidation') {
      const event = req.body[0]
      const isValidationEvent = event?.data?.validationCode &&
         event?.eventType == 'Microsoft.EventGrid.SubscriptionValidationEvent'
      if (isValidationEvent) {
         return res.send({
            "validationResponse": event.data.validationCode
         })
      }
   }

   const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
   if (!connString) throw Error('Azure Storage Connection string not found');

   const blobServiceClient = BlobServiceClient.fromConnectionString(connString);

   const containerName = process.env.CONTAINER_NAME;

   const containerClient = await blobServiceClient.getContainerClient(containerName);

   downloadBlobToFile(containerClient, 'products.db', './products.txt').then((res) => {
      console.log('done....', res);
   }).catch((e) => {
      console.log(e)
   })

   res.status(200).send(req.body);
})

app.listen({
      port: 8080
   }, () =>
   console.log(`🚀 Server ready at http://localhost:8080`)
);

async function downloadBlobToFile(containerClient, blobName, fileNameWithPath) {

   const blobClient = await containerClient.getBlobClient(blobName);

   await blobClient.downloadToFile(fileNameWithPath);
   console.log(`download of ${blobName} succeeded.`);
}