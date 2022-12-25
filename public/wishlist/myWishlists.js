const getWishlists = async () => {
    const accessToken = +window.localStorage.getItem("accessToken") || "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE5NmFkY2U5OTk5YmJmNWNkMzBmMjlmNDljZDM3ZjRjNWU2NDI3NDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aC1zZXJ2aWNlLXNpIiwiYXVkIjoiYXV0aC1zZXJ2aWNlLXNpIiwiYXV0aF90aW1lIjoxNjY5NzQ2NTQ0LCJ1c2VyX2lkIjoiN1VsZzhrVnB5a1Z4R3lUZ09iVnNIV3BMdEpXMiIsInN1YiI6IjdVbGc4a1ZweWtWeEd5VGdPYlZzSFdwTHRKVzIiLCJpYXQiOjE2Njk3NDY1NDQsImV4cCI6MTY2OTc1MDE0NCwiZW1haWwiOiJ0ZXN0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdDFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.ZRGvAccCadkznCCXp514w86ZIcd7mjmU_jAM7oB_I5QMZc0P88CfIWRV6WlZOJPQLqfb0II4wVutQyKWbDQG36Z7nI0ENdHtNWJ8N2CyQtiWKieaiXn1EwEfP8GJybQPp2iEtArp7JaPcdmrCSOqXSBLFe8qd8cQ0TXAZmsT27yAs0voLN-xYXha0Dig-9s2rWB8y2OIIEUMu9SXrgLEF7x3mNPGTPRALTFNO0fKoFwrQsf66Jc_-66q_ymN4GRqIeeDe4zvzuDxAzqRG_Vn38skWl3hdL-LQz3kswfj_gSAeujDOK1adPA4_DawELKjO4XI3tcQGNsjz1HdpACFjw";

    fetch('https://friends-si-exam.azurewebsites.net/wishlists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accessToken,
        }),
    }).then(async (response) => {
        const result = await response.json();
        console.log('result =', result);
        processResult(result);
    }).catch((e) => {
        console.log(e)
    });
}

getWishlists();

const processResult = (result) => {
    const tbodyRef = document.getElementById('wishlist-table').getElementsByTagName('tbody')[0];
    result.forEach(element => {
        // Insert a row at the end of table
        const newRow = tbodyRef.insertRow();
        for (let i = 0; i < 4; i++) {
            // Insert a cell at the end of the row
            const newCell = newRow.insertCell();
            let node;
            switch (i) {
                case 0:
                    // Append a text node to the cell - name
                    node = document.createTextNode(element.wishlist_name);
                    break;
                case 1:
                    // Append a text node to the cell - created by
                    node = document.createTextNode(element.created_by);
                    break;
                case 2:
                    // Append a text node to the cell - date
                    node = document.createTextNode(new Date(element.created_at).toLocaleDateString());
                    break;
                case 3:
                    // Append a text node to the cell - action button
                    node = document.createElement('button');
                    node.classList.add('btn', 'btn-primary');
                    node.textContent = 'View';
                    node.id = element.wishlist_id
                    node.onclick = navigateToWishlist;
                    break;
            }
            newCell.appendChild(node);
        }
    });
}