const { model, Schema } = require("mongoose");

const userSchema = new Schema({
	email: String,
	borrowed: [
		{id: String, borrowed: String, return: String}
	],
	creationTime: String,
	image: String,
	lastSignInTime: String,
	name: String,
	role: String
})

const usersCollection = model("User", userSchema);

module.exports = usersCollection;
