const User = require("../models/usersModel");
const { hashPassword } = require("../utils/hashing");
const {
  registerSchema,
  loginSchema,
  verifySchema, 
  verifyUserVerificationSchema,
  changePasswordSchema,
} = require("../middlewares/validator");
const { comparePassword, hmacProcess } = require("../utils/hashing");
const jwt = require("jsonwebtoken");
const transporter = require("../middlewares/sendEmail");

exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = registerSchema.validate({ email, password });
    if (error) {
      return res.status(401).json({ message: error.details[0].message });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({ message: "User already exists" });
    }
    const hashedPassword = await hashPassword(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({ message: "Registration Successful", user: result });
  } catch (error) {
    console.log(error);
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = loginSchema.validate({ email, password });
    if (error) {
      return res.status(401).json({ message: error.details[0].message });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const result = await comparePassword(password, user.password);
    if (!result) {
      return res.status(401).json({ message: "Incorrect Password" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, verified: user.verified },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res
      .cookie("token", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV !== "development",
        secure: process.env.NODE_ENV !== "development",
      })
      .json({ success: true, token, message: "Login Successful", user });
  } catch (error) {
    console.log(error);
  }
};

exports.logoutUser = async (req, res) => {
  res
    .clearCookie("token")
    .status(200)
    .json({ success: true, message: "Logout Successful" });
  res.status(200).json({ message: "Logout Successful" });
};

exports.verifyUser = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(401).json({ message: "Email is required" });
    }
    const { error, value } = verifySchema.validate({ email });
    if (error) {
      return res.status(401).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `<h1>Your verification code is <strong>${verificationCode}</strong></h1>`,
    };
    const result = await transporter.sendMail(mailOptions);
    if (result.accepted[0] === email) {
      const hashedVerificationCode = hmacProcess(verificationCode);
      user.verificationCode = hashedVerificationCode;
      user.verificationCodeExpires = Date.now();
      await user.save();
      res.status(200).json({ message: "Verification code sent to email" });
    }

    return res
      .status(400)
      .json({ message: "Failed to send verification code" });
  } catch (error) {
    console.log(error);
  }
};

exports.verifyUserVerification = async (req, res) => {
  const { email, verificationCode } = req.body;
  try {
    const { error, value } = verifyUserVerificationSchema.validate({
      email,
      verificationCode,
    });
    if (error) {
      return res.status(401).json({ message: error.details[0].message });
    }
    const updatedVerificationCode = verificationCode.toString();
    const user = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeExpires"
    );
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }
    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(401).json({ message: "Verify Your Email First" });
    }
    if (Date.now() - user.verificationCodeExpires > 10 * 60 * 1000) {
      return res.status(400).json({ message: "Verification code expired" });
    }
    if (user.verificationCode !== hmacProcess(updatedVerificationCode)) {
      return res.status(401).json({ message: "Invalid verification code" });
    }
    if (user.verificationCode === hmacProcess(updatedVerificationCode)) {
      user.verified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();
      res.status(200).json({ message: "Verification successful" });
    }
    return res
      .status(400)
      .json({ message: "Failed to verify user verification" });

  } catch (error) {
    console.log(error);
  }
};

exports.changePassword = async (req, res) => {
  const { id, verified } = req.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
    if(error) {
      return res.status(401).json({ message: error.details[0].message });
    }
    if(!verified) {
      return res.status(401).json({ message: "User not verified" });
    }
    const user = await User.findOne({ _id: id }).select("+password");
    if(!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const result = await comparePassword(oldPassword, user.password);
    if(!result) {
      return res.status(401).json({ message: "Incorrect old password" });
    }
    const hashedPassword = await hashPassword(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
    
  } catch (error) {
    console.log(error);
  }
}
