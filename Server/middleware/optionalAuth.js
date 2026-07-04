// middleware/optionalAuth.js
// Like `protect`, but does NOT reject the request if no/invalid token is present.
// Sets req.user if a valid token is found, otherwise continues with req.user = null.
// Used for routes that support both authenticated users and guests (e.g. POST /orders).

const jwt = require("jsonwebtoken");
const { User } = require("../models");

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Expired or invalid token — treat as guest
      req.user = null;
      return next();
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    req.user = user || null;
    return next();
  } catch (err) {
    // Any unexpected error — continue as guest
    req.user = null;
    return next();
  }
};

module.exports = { optionalAuth };
