const { model, Schema } = require("mongoose");

const CategorySchema = new Schema({
	category: String,
	id: Number,
	image: String,
})

const categoryCollection = model("categories", CategorySchema);

module.exports = categoryCollection;
