const jwt = require("jsonwebtoken");

exports.identifier = async (req, res, next) => {
  let token = req.cookies.token;
  if(req.headers.client === 'not-browser') {
    token = req.headers.authorization;
  }
  if(!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const userToken = token.split(" ")[1];
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    if(decoded) {
        req.user = decoded;
        next();
    } else{
        throw new Error("Error in token verification");
    }
  } catch (error) {
    console.log(error);
  }
}
