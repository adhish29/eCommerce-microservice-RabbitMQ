const jwt = require("jsonwebtoken");

module.exports = function isAuthenticated(req, res, next) {
  try {
    //"auth" -- custom header...doeesn't matter as long as it matches with the http header sent with req
    const token = req?.headers["auth"]?.split(" ")[1];
    // console.log(req.headers);
    const user = jwt.verify(token, "secretkey");
    // console.log(user);
    if (user) {
      req.user = user;
      next();
    }
  } catch (e) {
    res.json({ errorMessage: e.message });
  }
};
