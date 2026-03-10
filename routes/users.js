var express = require("express");
var router = express.Router();
const usersController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
/* GET users listing. */
router.get("/", authMiddleware, usersController.index);
router.get("/:id", authMiddleware, usersController.userbyid);
router.post("/", usersController.insert);
router.put("/:id", authMiddleware, usersController.update);
router.put("/changepass/:id", authMiddleware, usersController.updatePassword);
router.delete("/:id", authMiddleware, usersController.destroy);

// authen
router.post("/login", usersController.login);

module.exports = router;
