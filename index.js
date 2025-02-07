const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(helmet);
app.use(cookieparser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected!");
  })
  .catch((error) => {
    console.log("Error:", error);
  });

app.get("/", (req, res) => {
  res.json({ meesage: "Hello from server" });
});

app.listen(process.env.PORT, () => {
  console.log(`Listening from PORT ${process.env.PORT}`);
});
