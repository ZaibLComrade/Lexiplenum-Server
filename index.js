// Modules
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
app.use(express.json());
app.use(cors({
	origin: ["http://localhost:5173"],
	credentials: true,
})); // to exchange data between cross origins
app.use(cookieParser());

const verifyToken = (req, res, next) => {
	const token = req.cookies?.token;
	if(!token) {
		res.status(401).send({ message: "unauthorized" });
	}
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if(err) return res.status(401).send({ message: "unauthorized" });
		req.user = decoded;
		next();
	})
}

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

// Data collections
const usersCollection = database.collection("users");
const booksCollection = database.collection("books");
const categoryCollection = database.collection("categories");

// Secure APIs
app.post("/jwt", async(req, res) => {
	const method = req.query.method;
	const userCred = req.body;
	const token = jwt.sign(userCred, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
	if(method === "login") {
		res.cookie("token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
		}).send({ success: true })
	} else if(method === "logout") {
		res.clearCookie("token", { maxAge: 0 }).send({ success: true })
	}
})


// Book categories API
app.get("/categories", async(req, res) => {
	const categories = await categoryCollection.find().toArray();
	res.send(categories);
})

// Get category name by id
app.get("/categories/:id", async(req, res) => {
	const id = req.params.id;
	if(id === "all") return;
	const query = { id: parseInt(id) };
	const category = await categoryCollection.findOne(query);
	const name = category.category;
	res.send(name);
})

// CRUD operation APIs for books
app.get("/book/:id", async(req, res) => {
	const id = req.params.id;
	const query = { _id: new ObjectId(id) };
	const book = await booksCollection.findOne(query);
	res.send(book);
})

app.put("/book/:id", async(req, res) => { // Update book
	const id = req.params.id;
	const updatedBook = req.body;
	const query = { _id: new ObjectId(id) };
	const update = { $set: updatedBook };
	const result = await booksCollection.updateOne(query, update);
	res.send(result);
}) 

app.get("/books", async(req, res) => {
	const books = await booksCollection.find().toArray();
	res.send(books);
})

app.get("/books/borrowed", verifyToken, async(req, res) => {
	const email = req.query.email;
	// Verify User
	if(email !== req.user.email) {
		return res.status(401).send({ message: "unauthorized" })
	}
	
	const user = await usersCollection.findOne({ email })
	const borrowedArr = user.borrowed;
	const borrowedId = borrowedArr.map(id => new ObjectId(id))
	
	const filter = { _id: { $in: borrowedId } }
	const borrowedBooks = await booksCollection.find(filter).toArray();
	res.send(borrowedBooks)
})

app.get("/books/:category", async(req, res) => {
	const category = req.params.category;
	const filter = { category: parseInt(category) }
	const books = await booksCollection.find(filter).toArray();
	res.send(books);
})

app.post("/books", async(req, res) => {
	const newBook = req.body;
	const result = await booksCollection.insertOne(newBook);
	res.send(result);
})

app.put("/books", async(req, res) => {
	const updatedBook = req.body;
	const filter = { _id: new ObjectId(req.params.id) }
	const update = {
		$set: {
			image: null,
			title: null,
			category: null,
			quantity: null,
			rating: null,
			description: null,
		}
	}
	const result = await booksCollection.updateOne(filter, update)
	res.send(result);
})

app.delete("/books", async(req, res) => {
	const filter = { _id: new ObjectId(req.params.id) };
	const result = await booksCollection.deleteOne(filter)
	res.send(result);
})

// Users APIs
app.get("/users", async(req, res) => {
	const email = req.query.email;
	const query = { email }
	const userData = await usersCollection.findOne(query);
	res.send(userData);
})

app.post("/users", async(req, res) => {
	const newUser = req.body;
	const result = await usersCollection.insertOne(newUser);
	res.send(result)
})

app.put("/users/:email", async(req, res) => {
	const email = req.params.email;
	const newUser = req.body;
	const userExists = await usersCollection.findOne({ email });
	
	const { lastSignInTime } = newUser;
	let update = { $set: newUser }
	if(userExists) update = { $set: { lastSignInTime } }
	
	const filter = { email };
	const result = await usersCollection.updateOne(filter, update, {upsert: true});
	res.send(result);
})

app.patch("/users/borrow", async(req, res) => {
	const id = req.query.id;
	const email = req.query.email;
	const bookInfo = { id, ...req.body };
	
	const filter = { email };
	const update = {
		$addToSet: { borrowed: bookInfo }
	}
	const result = await usersCollection.updateOne(filter, update)
	if(result.modifiedCount) {
		const query = { _id: new ObjectId(id) }
		const modification ={ $inc: { quantity: -1 } }
		const reduced = booksCollection.updateOne(query, modification);
	}
	res.send(result);
})

// Root (test)
app.get('/', (req, res) => {
	res.send("Lexiplenum server");
})

// Listning to port
app.listen(port, () => {
	console.log("listening port", port);
})
