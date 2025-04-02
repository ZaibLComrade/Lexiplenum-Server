const { model, Schema } = require("mongoose");

const ContentSchema = new Schema({
	image: String,
	title: String,
	content: String
})

const contentsCollection = model("Content", ContentSchema);

module.exports = contentsCollection;
