// Jose Bernardo Montano
// CSC337 - PA9: Ostaa
// server.js is the server-side js logic that will handle the different
// POST and GET request to the server in order to push some new data to the DB
// or get certain data based on different parameters. It will handle the data
// of users and items

const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 80;

// Connection String
const mongoDB =
  "mongodb+srv://jbm3:65lGdgF0hrtRZtE2@clusterostraa1.cphvdos.mongodb.net/?retryWrites=true&w=majority";

// Schemas used to work with the objects of Users and Items
// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  listings: [],
  purchases: [],
});

// Item Schema
const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  price: Number,
  stat: String,
});

// Model classes for the new objects
const User = mongoose.model("User", userSchema);
const Item = mongoose.model("Item", itemSchema);

app.use(bodyParser.json());

// Connecting to DB
mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Client side files used by express
app.use(express.static("public_html"));

// POST ROUTING

// This route will take care to see if the user exists and
// will create the cookie necessary to logged in the user
app.post("/checkLogin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await User.findOne({ username: username });
    if (user && user.password === password) {
      res.cookie("username", username, {
        maxAge: 900000, // 5 minutes
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
      console.log(res.getHeaders()["set-cookie"]);
      res.status(200).json({ loggedIn: true });
    } else {
      res.status(200).json({ loggedIn: false });
    }
  } catch (err) {
    res.status(500).json({ loggedIn: false });
  }
});

// Post request to add an item to DB and user linked to the item is updated in the DB as well
app.post("/add/item/:USERNAME", async (req, res) => {
  try {
    const item = new Item({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      price: req.body.price,
      stat: req.body.status,
    });
    await item.save();
    console.log("Item saved");

    const user = await User.findOne({ username: req.params.USERNAME });
    if (user === null) {
      console.log("User has not been found");
      return;
    }
    if (item.stat === "SALE") {
      user.listings.push(item._id);
    } else if (item.stat === "SOLD") {
      user.purchases.push(item._id);
    }
    await user.save();
    console.log("User has been updated");
    res.sendStatus(200);
  } catch (err) {
    console.log("Error at back-end");
    res.sendStatus(500);
  }
});

// Post request to add user to the DB
app.post("/add/user/", async (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    listings: [],
    purchases: [],
  });
  const existingUser = await User.findOne({ username: req.body.username });
  if (existingUser) {
    return res.status(409).json({ message: "User exists already!" });
  }
  // Promise
  user
    .save()
    .then(() => {
      console.log("User saved!");
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log("Error at saving user!");
      res.sendStatus(500);
    });
});

// This route will make possible for the user to buy an item
// and it will change the status of the item and will move it
// from listing to purchases
app.post("/buyItem/:item/:username", async (req, res) => {
  console.log("Testing");
  try {
    const userStr = req.params.username;
    const itemTitle = req.params.item;

    const user = await User.findOne({ username: userStr });

    if (!user) {
      res.status(404).json({ message: "USER NOT FOUND" });
    }

    const item = await Item.findOne({ title: itemTitle });

    if (!item) {
      res.status(404).json({ message: "ITEM NOT FOUND" });
    }

    console.log(`Our ${item.id}`);
    if (item.stat === "SALE") {
      item.stat = "SOLD";
      let listingsArr = user.listings;
      user.listings = listingsArr.filter(
        (listing) => listing.toString() !== item.id
      );

      user.purchases.push(item.id);
      await user.save();
      await item.save();
      res.sendStatus(200);
    }
  } catch (err) {
    res.status(500).json({ message: "ERROR IN SERVER SIDE" });
  }
});

// GETS ROUTING
// GET request to return a JSON array containing the info of the users
app.get("/get/users/", (req, res) => {
  User.find({})
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("ERROR GET: get/users/");
    });
});

// GET request to return a JSON array containing the info of the items
app.get("/get/items/", (req, res) => {
  Item.find({})
    .then((items) => {
      res.status(200).json(items);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("ERROR GET: get/users/");
    });
});

// GET request to return a JSON array containing every listing (item) for a user
app.get("/get/listings/:USERNAME", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.USERNAME }).populate(
      "listings"
    );
    if (user != null) {
      const listingsPopulated = await Promise.all(
        user.listings.map(async (listing) => {
          const itemLinked = await Item.findById(listing._id);
          return {
            title: itemLinked.title,
            description: itemLinked.description,
            image: itemLinked.image,
            price: itemLinked.price,
            stat: itemLinked.stat,
          };
        })
      );
      res.json(listingsPopulated);
    } else {
      console.log("User not found");
    }
  } catch (err) {
    console.log("Error at getting items from listings");
    res.sendStatus(500);
  }
});

// GET request to return a JSON array containing every purchase (item) for a user
app.get("/get/purchases/:USERNAME", async (req, res) => {
  try {
    const username = req.params.USERNAME;
    const user = await User.findOne({ username: username }).populate(
      "purchases"
    );
    if (user != null) {
      const purchasesPopulated = await Promise.all(
        user.purchases.map(async (purchase) => {
          const itemLinked = await Item.findById(purchase);
          return {
            title: itemLinked.title,
            description: itemLinked.description,
            image: itemLinked.image,
            price: itemLinked.price,
            stat: itemLinked.stat,
          };
        })
      );
      res.json(purchasesPopulated);
    } else {
      console.log("User not found");
    }
  } catch (err) {
    console.log("Error at getting items from purchases");
    res.sendStatus(500);
  }
});

// GET request should return a list of every user whose username has a certain substring
app.get("/search/users/:KEYWORD", async (req, res) => {
  try {
    const keyword = req.params.KEYWORD;
    const users = await User.find({ username: { $regex: keyword } });
    res.json(users);
    console.log("List pulled successfully");
  } catch (err) {
    console.log(
      `Error at search for users with the keyword: ${req.params.KEYWORD}`
    );
    res.sendStatus(500);
  }
});

// GET request should return a list of every item whose description has a certain substring
app.get("/search/items/:KEYWORD", async (req, res) => {
  try {
    const keyword = req.params.KEYWORD;
    const items = await Item.find({ description: { $regex: keyword } });
    res.json(items);
    console.log(`Retrieved list of item with description: ${keyword}`);
  } catch (err) {
    console.log(
      `Error at searching for items with the description ${req.params.KEYWORD}`
    );
    res.sendStatus(500);
  }
});

// Used for easy access
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
