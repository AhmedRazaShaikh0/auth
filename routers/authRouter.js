const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, verifyUser, verifyUserVerification, changePassword } = require("../controllers/authController");
const { identifier } = require("../middlewares/identification");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", identifier, logoutUser);
router.patch("/verify", identifier, verifyUser);
router.patch("/verify-user", identifier, verifyUserVerification);
router.patch("/change-password", identifier, changePassword);

module.exports = router;
