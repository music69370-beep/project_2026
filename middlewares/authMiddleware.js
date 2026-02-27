const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    // 1. ກວດເບິ່ງວ່າ Header ມີ Authorization ບໍ່
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).send({ message: "No token provided", success: false });
    }

    // 2. ດຶງ Token ອອກມາ (Bearer <token>)
    const token = authHeader.split(" ")[1];

    // 3. Verify Token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Auth failed: Token invalid or expired",
          success: false,
        });
      } else {
        // 4. ເກັບຂໍ້ມູນ User ໄວ້ໃນ req.user (ແນະນຳໃຫ້ໃຊ້ req.user ແທນ req.body)
        // ເພື່ອບໍ່ໃຫ້ໄປປົນກັບຂໍ້ມູນທີ່ User ສົ່ງມາໃນ Body
        req.user = decoded; 
        next();
      }
    });
  } catch (error) {
    return res.status(401).send({
      message: "Auth failed",
      success: false,
    });
  }
};