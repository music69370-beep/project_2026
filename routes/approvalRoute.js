const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
// ຢ່າລືມໃສ່ Middleware ກວດສອບວ່າເປັນ Admin ບໍ່
// const { isAdmin } = require('../middlewares/authMiddleware'); 

router.post('/submit', approvalController.submitApproval);

module.exports = router;