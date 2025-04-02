const { model, Schema  } = require("mongoose")

const BooksSchema = new Schema({
	image: String,
	title: String,
	author: String,
	category: Number,
	quantity: Number,
	rating: Number,
	description: String,
	category_name: Number,
})

const booksCollection = model("Book", BooksSchema);

module.exports = booksCollection;
