const gqlRquest = async (query, variables, operationName) => {
   const endpoint = 'https://si-products.azurewebsites.net/graphql';
   const headers = {
      'content-type': 'application/json',
      //Send token obviously
      //'Authorization': token
   };
   const graphqlQuery = {
      operationName,
      query,
      variables,
   };

   const options = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(graphqlQuery),
   };

   const response = await fetch(endpoint, options);
   return await response.json();
};
