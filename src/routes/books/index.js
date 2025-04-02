const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/verifyToken");
const { ObjectId } = require("mongoose");

const categoryCollection = require("../../models/Category");
const booksCollection = require("../../models/Book");
const contentsCollection = require("../../models/Content");

// Get books borrowed and return date
router.get('/borrowed-dates', verifyToken, async(req, res) => {
	const email = req.query.email;
	if(email !== req.user.email) {
		return res.status(401).send({ message: "unauthorized" })
	}
	const user = await usersCollection.findOne({ email })
	const borrowedArr = user.borrowed
	res.send(borrowedArr);
})

// Book categories API
router.get("/categories", async(req, res) => {
	const categories = await categoryCollection.find();
	res.send(categories);
})

// Get category name by id
router.get("/categories/:id", async(req, res) => {
	const id = req.params.id;
	if(id === "all") return;
	const query = { id: parseInt(id) };
	const category = await categoryCollection.findOne(query);
	const name = category.category;
	res.send(name);
})

// Get book content using initial id
router.get("/book/content", async(req, res) => {
	const id = req.query.id;
	const bookFilter = { _id: new ObjectId(id) };
	const book = await booksCollection.findOne(bookFilter);
	
	const contentQuery = { title: book.title };
	const content = await contentsCollection.findOne(contentQuery);
	res.send(content);
})

// CRUD operation APIs for books
router.get("/book/:id", async(req, res) => {
	const id = req.params.id;
	const query = { _id: id };
	const book = await booksCollection.findById(query);
	res.send(book);
})

router.patch("/book/:id", verifyToken, async(req, res) => { // Update book
	// Verify if the user have privilage to update book
	console.log(req.user);
	if(req.user.role !== "librarian") {
		return res.status(403).send({ message: "forbidden" })
	}
	
	const id = req.params.id;
	const updatedBook = req.body;
	const query = { _id: id };
	const update = { $set: updatedBook };
	const result = await booksCollection.findByIdAndUpdate(query, update);
	res.send(result);
}) 
// Get all books
router.get("/books", verifyToken, async(req, res) => { 
	console.log(req.user);
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
router.get("/books/borrowed", verifyToken, async(req, res) => {
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
router.get("/books/:category", async(req, res) => {
	const category = req.params.category;
	const filter = { category: parseInt(category) }
	const books = await booksCollection.find(filter);
	console.log(books);
	res.send(books);
})

router.post("/books", verifyToken, async(req, res) => { // Add a book
	if(req.user.email !== req.query.email) {
		return res.status(401).send({ message: "unauthorized" });
	}
	
	const newBook = req.body;
	const result = await booksCollection.insertOne(newBook);
	res.send(result);
})

router.delete("/books", async(req, res) => {
	const filter = { _id: new ObjectId(req.params.id) };
	const result = await booksCollection.deleteOne(filter)
	res.send(result);
})

module.exports = router;
