const express = require("express");
const jwt = require("jsonwebtoken");
const usersCollection = require("../../models/User");
const router = express.Router()

// Secure APIs
router.post("/jwt", async(req, res) => {
	const method = req.query.method;
	const userCred = req.body;
	if(method === "login") {
		const options = { projection: { role: 1, _id: 0 } }
		const role = await usersCollection.findOne(userCred, options);
		const userInfo = { email: userCred.email, role: role?.role || "user" }
		const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
		
		res.cookie("token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
		}).send({ success: true })
	} else if(method === "logout") {
		res.clearCookie("token", { maxAge: 0 }).send({ success: true })
	}
})

module.exports = router;
