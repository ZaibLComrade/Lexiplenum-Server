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
	origin: [
		"http://localhost:5173",
		"https://lexiplenum.web.app",
		"https://lexiplenum.firebaseapp.com",
	],
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
const contentsCollection = database.collection("contents");

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

// Get books borrowed and return date
app.get('/borrowed-dates', verifyToken, async(req, res) => {
	const email = req.query.email;
	if(email !== req.user.email) {
		return res.status(401).send({ message: "unauthorized" })
	}
	const user = await usersCollection.findOne({ email })
	const borrowedArr = user.borrowed
	res.send(borrowedArr);
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

// Get book content using initial id
app.get("/book/content", async(req, res) => {
	const id = req.query.id;
	const bookFilter = { _id: new ObjectId(id) };
	const book = await booksCollection.findOne(bookFilter);
	
	const contentQuery = { title: book.title };
	const content = await contentsCollection.findOne(contentQuery);
	res.send(content);
})

// CRUD operation APIs for books
app.get("/book/:id", async(req, res) => {
	const id = req.params.id;
	const query = { _id: new ObjectId(id) };
	const book = await booksCollection.findOne(query);
	res.send(book);
})

app.patch("/book/:id", async(req, res) => { // Update book
	const id = req.params.id;
	const updatedBook = req.body;
	const query = { _id: new ObjectId(id) };
	const update = { $set: updatedBook };
	const result = await booksCollection.updateOne(query, update);
	res.send(result);
}) 

app.get("/books", verifyToken, async(req, res) => { // Get all books
	const filter = req.query.filter;
	if(req.query.email !== req.user.email) {
		return res.status(401).send({ message: "unauthorized" })
	}
	let filt = {};
	if(filter === "true") filt = { quantity: { $gt: 0 } }
	const books = await booksCollection.find(filt).toArray();
	res.send(books);
})

// Get user specific borrowed books
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

// Get books based on category
app.get("/books/:category", async(req, res) => {
	const category = req.params.category;
	const filter = { category: parseInt(category) }
	const books = await booksCollection.find(filter).toArray();
	console.log(books);
	res.send(books);
})

app.post("/books", verifyToken, async(req, res) => { // Add a book
	if(req.query.email !== req.user.email) {
		return res.status(401).send({ message: "unauthorized" });
	}
	const newBook = req.body;
	const result = await booksCollection.insertOne(newBook);
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

// Add a user
app.post("/users", async(req, res) => {
	const newUser = req.body;
	const result = await usersCollection.insertOne(newUser);
	res.send(result)
})

// Update or insert a user
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

// Borrow a book
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

//Return a book
app.delete("/users/return", async(req, res) => {
	const email = req.query.email;
	const returnedBook = req.query.book_id;
	const userQuery = { email };
	const bookQuery = { _id: new ObjectId(returnedBook) }
	const update = { 
		$pull: { borrowed: { id: returnedBook  } },
	};
	const ret = await usersCollection.updateOne(userQuery, update)
	
	const bookUpdate = {
		$inc: { quantity: 1 },
	}
	const bookReturned = await booksCollection.updateOne(bookQuery, bookUpdate);
	
	res.send(ret);
})

// Root (test)
app.get('/', (req, res) => {
	res.send("Lexiplenum server");
})

// Listning to port
app.listen(port, () => {
	console.log("listening port", port);
})
