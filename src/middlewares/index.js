// Importing modules
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const applyMiddlewares = app => {
	// Applying modues
	app.use(express.json());
	app.use(cors({
		origin: [
			"http://localhost:5173",
			"https://lexiplenum.web.app",
			"https://lexiplenum.firebaseapp.com",
		],
		credentials: true,
	}));
	app.use(cookieParser());
}

module.exports = applyMiddlewares;
