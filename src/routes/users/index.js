const express = require("express");
const router = express.Router();

const usersCollection = require("../../models/User");

// Users APIs
router.get("/users", async(req, res) => {
	const email = req.query.email;
	const query = { email }
	const userData = await usersCollection.findOne(query);
	res.send(userData);
})

// Add a user
router.post("/users", async(req, res) => {
	const newUser = req.body;
	const result = await usersCollection.insertOne(newUser);
	res.send(result)
})

// Update or insert a user
router.put("/users/:email", async(req, res) => {
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
router.patch("/users/borrow", async(req, res) => {
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
router.delete("/users/return", async(req, res) => {
	const email = req.query.email;
	const returnedBook = req.query.book_id;
	const userQuery = { email };
	const update = { 
		$pull: { borrowed: { id: returnedBook  } },
	};
	const ret = await usersCollection.updateOne(userQuery, update)
	
	const bookUpdate = {
		$inc: { quantity: 1 },
	}
	res.send(ret);
})

module.exports = router;
