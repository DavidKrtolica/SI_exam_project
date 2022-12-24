const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
const accessToken = +window.localStorage.getItem("accessToken") || "file:///C:/Users/dimit/Desktop/SI_exam_project/public/wishlist/wishlist.html?id=122";

const connectSocketServer = () => {
  const socketUrl = 'wss://friends-si-exam.azurewebsites.net';
  const accessToken = +window.localStorage.getItem("accessToken");
  return io(socketUrl, {
    extraHeaders: {
      Authorization: `Bearer ${accessToken || "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3NTNiYmFiM2U4YzBmZjdjN2ZiNzg0ZWM5MmY5ODk3YjVjZDkwN2QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aC1zZXJ2aWNlLXNpIiwiYXVkIjoiYXV0aC1zZXJ2aWNlLXNpIiwiYXV0aF90aW1lIjoxNjcxODQ5MjQ0LCJ1c2VyX2lkIjoicWsyYWJXck5FVlY4M3VFRkRZMHZmZXUwdG9hMiIsInN1YiI6InFrMmFiV3JORVZWODN1RUZEWTB2ZmV1MHRvYTIiLCJpYXQiOjE2NzE4NDkyNDQsImV4cCI6MTY3MTg1Mjg0NCwiZW1haWwiOiJneUBqay5ra2tra2tra2siLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZ3lAamsua2tra2tra2trIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.T6rM1SPPm2G0T9xLsYBJDtLZcwW5r6OFaQjPWzOnPSHDskFARiu2WLsKXkJ7BoGV6fmrHTotG4_qWxx7C_uG3J2QeqDZthZ2O8FH9-XcaJIJ4e8-tAVYSnTmNT3Ld14dRbEFzNQ1EIyl8-iVjAml4DMRImkyarWyPb5gNEs-zMrF3psdkolwTYAO--IsPWQ7c_OZqTbBzrZQ_J7o_SygshYk4yCLjUJ4cF7kZIaM3SyTev26wmfv4k1q_9rKk84REAwf_hbBn4Xo8hcqYr64iv3cbtxAATCb4Ss6NL05p5ZA6AHjzP9gNqOAwC2OjUkfH2rPFUQc9yw2l1uuEqiPow"}`
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
    console.log(wishlistData)
    document.querySelectorAll('.friend').forEach(e => e.remove());
    processFriendsData(wishlistData);
  })
}

//TODO: implement
const getWishlistData = async () => { }

getFriendsData();

const processFriendsData = (data) => {
  for (const property in data) {
    for (const friend of data[property]) {
      const friendsList = document.getElementById("friends-list");
      newLiElement = document.createElement("li");
      newText = document.createTextNode(`${friend.userEmail} - ${property}`);
      newLiElement.appendChild(newText);
      newLiElement.classList.add("list-group-item", 'friend');
      friendsList.appendChild(newLiElement);
    }
  }
}

// products and wl name
//TODO: implement
const processWishlistData = () => { }

const submitInvite = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  let wishlistId = params.id;
  const wishlistName = document.getElementById('wishlist-name').textContent;
  const emailTo = document.getElementById('form3Example3c').value;
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
  }).then((response) => {
    if (response.status !== 200) {
      const span = document.getElementById("invite-response-message");
      span.innerHTML = 'Something went wrong';
      throw new Error('An error occured');
    } else {
      const span = document.getElementById("invite-response-message");
      span.innerHTML = 'Success!';
      const friendsList = document.getElementById("friends-list");
      newLiElement = document.createElement("li");
      newText = document.createTextNode(`${emailTo} - notRegistered`);
      newLiElement.appendChild(newText);
      newLiElement.classList.add("list-group-item");
      friendsList.appendChild(newLiElement);
    }
  }).catch((e) => {
    console.log(e);
  });
}

