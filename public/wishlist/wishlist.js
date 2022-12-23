const socketUrl = 'wss://friends-si-exam.azurewebsites.net';

const connectSocketServer = () => {
  const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
  const accessToken = +window.localStorage.getItem("accessToken");
  return io(socketUrl, {
    extraHeaders: {
      Authorization: `Bearer ${accessToken || "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE5NmFkY2U5OTk5YmJmNWNkMzBmMjlmNDljZDM3ZjRjNWU2NDI3NDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aC1zZXJ2aWNlLXNpIiwiYXVkIjoiYXV0aC1zZXJ2aWNlLXNpIiwiYXV0aF90aW1lIjoxNjY5NzQ2NTQ0LCJ1c2VyX2lkIjoiN1VsZzhrVnB5a1Z4R3lUZ09iVnNIV3BMdEpXMiIsInN1YiI6IjdVbGc4a1ZweWtWeEd5VGdPYlZzSFdwTHRKVzIiLCJpYXQiOjE2Njk3NDY1NDQsImV4cCI6MTY2OTc1MDE0NCwiZW1haWwiOiJ0ZXN0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdDFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.ZRGvAccCadkznCCXp514w86ZIcd7mjmU_jAM7oB_I5QMZc0P88CfIWRV6WlZOJPQLqfb0II4wVutQyKWbDQG36Z7nI0ENdHtNWJ8N2CyQtiWKieaiXn1EwEfP8GJybQPp2iEtArp7JaPcdmrCSOqXSBLFe8qd8cQ0TXAZmsT27yAs0voLN-xYXha0Dig-9s2rWB8y2OIIEUMu9SXrgLEF7x3mNPGTPRALTFNO0fKoFwrQsf66Jc_-66q_ymN4GRqIeeDe4zvzuDxAzqRG_Vn38skWl3hdL-LQz3kswfj_gSAeujDOK1adPA4_DawELKjO4XI3tcQGNsjz1HdpACFjw"}`
    }
  });
}

const getFriendsData = async () => {
  const socket = await connectSocketServer();
  console.log('socket = ', socket);
  socket.on('friends', (result) => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let wishlistId = params.id;
    const wishlistData = result.friends[wishlistId];
    process(wishlistData);
  })
}

//TODO: implement
const getWishlistData = async () => { }

getFriendsData();

const processFriendsData = (data) => {
  console.log(data);
  //TODO: create dom elements
}

// products and wl name
//TODO: implement
const processWishlistData = () => { }

//TODO: implement invite