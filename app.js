// Importing modules
const express = require("express");
require("dotenv").config();

// Initializing API
const app = express();

// Initializations
const port = process.env.PORT || 5000;
const globalErrorHandler = require("./src/utils/globalErrorHandler");
const ConnectDB = require("./src/db/ConnectDB");
const applyMiddlewares = require("./src/middlewares");
const books = require("./src/routes/books");
const users = require("./src/routes/users");
const token = require("./src/routes/authentication");

// Middlewares
applyMiddlewares(app);
app.use(token);
app.use(books);
app.use(users);


// Check if server is running
app.get("/health", (req, res) => {
	res.send("Server is running");
})

// Invalid paths
app.all("/*", (req, res, next) => {
	const error = new Error(`Couldn't find ${req.originalUrl} path`);
	error.status = 404;
	next(error);
})

app.use(globalErrorHandler);

const main = async () => {
	await ConnectDB();
	app.listen(port, () => {
		console.log("Listening to port", port);
	})
}; main();
