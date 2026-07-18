const jwt = require("jsonwebtoken");
const config = require("../config/config.js");

function authorize(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({message:"authentication is required"});
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded.role;  
        next();
    } catch (error) {
        return res.status(401).json({ message: "Error in Authentication" });
    }
}
function authenticateRole(allocatedRoles) {
  return (req, res, next) => {
    if (!allocatedRoles.includes(req.user)) {
      return res.status(403).json({ message: 'Forbidden: Access is denied' });
    }
    next();
  };
}


module.exports = { authorize, authenticateRole };
