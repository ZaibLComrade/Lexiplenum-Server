const mongoose = require("mongoose");
require("dotenv").config();

const getURIString = () => {
	let uri = "";
	if(process.env.NODE_ENV === "development") {
		uri = process.env.DATABASE_LOCAL;
		uri = uri.replace("<username>", process.env.DB_USER);
		uri = uri.replace("<password>", process.env.DB_PASS);
	} else {
		uri = process.env.DATABASE_PROD;
	}
	return uri;
}

const ConnectDB = async () => {
	console.log("Connecting to Database...");
	const uriString = getURIString();
	await mongoose.connect(uriString, { dbName: process.env.DB_NAME })
	console.log("Connected to Databse");
}

module.exports = ConnectDB;
