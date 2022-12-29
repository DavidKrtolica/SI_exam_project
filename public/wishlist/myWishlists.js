const getWishlists = async () => {
    const accessToken = window.localStorage.getItem("accessToken");
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