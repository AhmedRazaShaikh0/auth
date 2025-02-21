const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, verifyUser, verifyUserVerification } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.patch("/verify", verifyUser);
router.patch("/verify-user", verifyUserVerification);

module.exports = router;
