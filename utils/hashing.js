const bcrypt = require("bcryptjs");
const crypto = require("crypto");

exports.hashPassword = (value, saltValue) => {
  return bcrypt.hash(value, saltValue);
};

exports.comparePassword = (value, hashedValue) => {
  return bcrypt.compare(value, hashedValue);
};

exports.hmacProcess = (value) => {
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(value).digest("hex");
};

