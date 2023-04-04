"use strict";

// Jose Bernardo Montano
// CSC337 - PA9: Ostaa
// Script.js is the client-side js logic that will get the input from the html elements
// and will make the calls to the server-side, where it will talk to the server and
// retrieve or saved the data from the user

const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
};

const welcomeMessage = () => {
  console.log("welcomeMessage is being called...");
  const user = getCookie("username");
  if (user) {
    document.getElementById(
      "greeting"
    ).textContent = `Welcome ${user}! What would you like to do?`;
  }
};

const viewPurchases = () => {
  const username = getCookie("username");
  if (!username) {
    return;
  }
  fetch(`/get/purchases/${username}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log("Error");
      }
    })
    .then((purchases) => {
      const areaToDisplay = document.querySelector(".displayArea");
      areaToDisplay.innerHTML = "";
      console.log(purchases);
      if (purchases.length >= 1) {
        purchases.forEach((purchase) => {
          const htmlElements = `<div class="item">
            <h3>${purchase.title}</h3>
            <p>${purchase.image}</p>
            <p>${purchase.description}</p>
            <p>${purchase.price}</p>
            <p>SOLD</p>
          </div>;`;
          areaToDisplay.insertAdjacentHTML("beforeend", htmlElements);
        });
      }
    })
    .catch((err) => console.log(err));
};

const viewListings = () => {
  const username = getCookie("username");
  if (!username) {
    return;
  }
  fetch(`/get/listings/${username}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log("Error");
      }
    })
    .then((listings) => {
      const areaToDisplay = document.querySelector(".displayArea");
      areaToDisplay.innerHTML = "";
      console.log(listings);
      if (listings.length >= 1) {
        let num = 0;
        listings.forEach((listing) => {
          const htmlElements = `<div class="item">
            <h3>${listing.title}</h3>
            <p>${listing.image}</p>
            <p>${listing.description}</p>
            <p>${listing.price}</p>
            <input
              type="button"
              id="buyItem"
              onclick="buyItem('${listing.title}');"
              value="Buy Item"
            />
          </div>`;
          areaToDisplay.insertAdjacentHTML("beforeend", htmlElements);
          num += 1;
        });
      }
    })
    .catch((err) => console.log(err));
};

const buyItem = (title) => {
  console.log("Buy Item function is being called...");
  const username = getCookie("username");
  const item = title;
  console.log(item);
  if (!username) {
    return;
  }
  fetch(`/buyItem/${item}/${username}`, {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        console.log("OK");
        viewListings();
      } else {
        console.log("Error at client side /buyItem");
      }
    })
    .catch((err) => console.log(err));
};

const searchListings = () => {
  const username = getCookie("username");
  if (!username) {
    return;
  }
  const keyword = document.getElementById("searchListingInput").value;
  fetch(`/search/items/${keyword}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log("Error");
      }
    })
    .then((listings) => {
      const areaToDisplay = document.querySelector(".displayArea");
      areaToDisplay.innerHTML = "";
      console.log(listings);
      if (listings.length >= 1) {
        let num = 0;
        listings.forEach((listing) => {
          console.log(listing);
          if (listing.stat === "SALE") {
            const htmlElements = `<div class="item">
            <h3>${listing.title}</h3>
            <p>${listing.image}</p>
            <p>${listing.description}</p>
            <p>${listing.price}</p>
            <input
              type="button"
              id="buyItem"
              onclick="buyItem('${listing.title}');"
              value="Buy Item"
            />
            </div>`;
            areaToDisplay.insertAdjacentHTML("beforeend", htmlElements);
          } else if (listing.stat === "SOLD") {
            const htmlElements = `<div class="item">
            <h3>${listing.title}</h3>
            <p>${listing.image}</p>
            <p>${listing.description}</p>
            <p>${listing.price}</p>
            <p>SOLD</p>
            </div>`;
            areaToDisplay.insertAdjacentHTML("beforeend", htmlElements);
          }
        });
      }
    })
    .catch((err) => console.log(err));
};

const createListing = () => {
  const username = getCookie("username");
  if (!username) {
    return;
  }
  window.location.href = "post.html";
};

const loginUser = async () => {
  const username = document.getElementById("usernameLogin").value;
  const password = document.getElementById("passwordLogin").value;

  const response = await fetch("/checkLogin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username, password: password }),
  });

  const data = await response.json();
  console.log(data);
  if (data.loggedIn) {
    window.location.href = "home.html";
  } else {
    document.getElementById("alertLogin").textContent =
      "Username or password is invalid";
  }
};

const createUser = () => {};

// sendUserData will make a call to the server-side, server.js, in order
// to post the user data on the mongoDB collection if successful
const sendUserData = (data) => {
  fetch("/add/user/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        console.log("User saved to DB!");
      } else {
        console.log("Error at saving user to DB!");
      }
    })
    .catch((error) => console.log("Error at saving user to DB!"));
};

// sendItemData will make a call to the server-side, server.js, in order
// to post the item data on the mongoDB collection if successful
const sendItemData = (data) => {
  const username = getCookie("username");
  fetch(`/add/item/${username}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Item saved to DB!");
      } else {
        console.log("Error at saving item to DB!");
      }
    })
    .catch((error) => console.log("Error at saving item to DB!"));
};

// addUser function will retrieve the text for username and password
// and passed them to createUserObjectForJSON which will create an object
// that will be passed then to sendUserData
const addUser = () => {
  const username = document.getElementById("usernameCreate").value;
  const password = document.getElementById("passwordCreate").value;
  const data = createUserObjectForJSON(username, password);
  sendUserData(data);
  alert("User created!");
};

// addItem function will retrieve the texts from the items fields
// and passed them to createItemObjectForJSON which will create an object
// that will be passed then to sendItemData
const addItem = () => {
  const user = getCookie("username");
  if (!user) {
    return;
  }
  const title = document.getElementById("titleInput").value;
  const description = document.getElementById("descInput").value;
  const image = document.getElementById("imageInput").value;
  const price = document.getElementById("priceRow").value;
  const status = document.getElementById("statusRow").value;
  const data = createItemObjectForJSON(
    title,
    description,
    image,
    price,
    status
  );
  sendItemData(data);
  window.location.href = "home.html";
};

// createItemObjectForJSON will create an object for item that will
// be helpful once we send the json to the server, returns the object
const createItemObjectForJSON = (
  title,
  description,
  image,
  price,
  status,
  username
) => {
  const data = {
    title: title,
    description: description,
    image: image,
    price: price,
    status: status,
    username: username,
  };
  return data;
};

// createUserObjectForJSON will create an object for item that will
// be helpful once we send the json to the server, returns the object
const createUserObjectForJSON = (username, password) => {
  const data = {
    username: username,
    password: password,
    listings: [],
    purchases: [],
  };
  return data;
};
