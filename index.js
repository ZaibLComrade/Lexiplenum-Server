// Modules
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config() // use enviromnent variables

// Database uri string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m7nddwt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Initializations
const app = express();
const database = client.db('lexiplenum')

// Middlewares
app.use(cors()); // to exchange data between cross origins

// Data collections
const usersCollection = database.collection("users");
const booksCollection = database.collection("books");
const categoryCollection = database.collection("categories");


// async function runDB() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();

// 	  const books = await booksCollection.find().toArray();
// 	  const categories = await categoryCollection.find().toArray();
// 	  const users = await usersCollection.find().toArray();

// 	  console.log(users, categories, books);

//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// runDB().catch(console.dir);


// Root (test)
app.get('/', (req, res) => {
	res.send("Lexiplenum server");
})

// Listning to port
app.listen(port, () => {
	console.log("listening port", port);
})
