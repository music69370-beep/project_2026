const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const models = require("../models/index");
require("dotenv").config();

// 1. ດຶງຂໍ້ມູນ User ທັງໝົດ
exports.index = async (req, res, next) => {
  try {
    const users = await models.User.findAll({
      attributes: ["user_id", "full_name", "email", "role", "department", "createdAt"], // ປ່ຽນຕາມ Field ໃໝ່
      order: [["user_id", "DESC"]],
    });

    res.status(200).json({
      message: "success",
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. ດຶງຂໍ້ມູນ User ຕາມ ID
exports.userbyid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await models.User.findByPk(id, {
      attributes: { exclude: ["password"] }, // ບໍ່ສົ່ງ password ອອກໄປ
    });
    if (!user) {
      return res.status(404).json({ message: "ບໍ່ພົບຜູ້ໃຊ້" });
    }
    res.status(200).json({ message: "success", data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. ເພີ່ມຂໍ້ມູນ User (Register)
exports.insert = async (req, res, next) => {
  try {
    // ຮັບຄ່າຕາມ Field ໃໝ່
    const { full_name, email, password, role, department } = req.body;

    const existEmail = await models.User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: "Email ນີ້ມີຜູ້ນໍາໃຊ້ແລ້ວ" });
    }

    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(password, salt);

    const user = await models.User.create({
      full_name,
      email,
      password: passwordHash,
      role: role || 'user', // ຖ້າບໍ່ສົ່ງມາໃຫ້ເປັນ user
      department
    });

    res.status(201).json({
      message: "ບັນທຶກຂໍ້ມູນສຳເລັດ",
      data: { id: user.user_id, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. ແກ້ໄຂຂໍ້ມູນ User
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, department } = req.body;

    const user = await models.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "ບໍ່ພົບຜູ້ໃຊ້" });
    }

    await models.User.update(
      { full_name, email, role, department },
      { where: { user_id: id } }
    );

    res.status(200).json({ message: "ອັບເດດຂໍ້ມູນສຳເລັດ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. ລຶບຂໍ້ມູນ User
exports.destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await models.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "ບໍ່ພົບຜູ້ໃຊ້" });
    }
    await models.User.destroy({ where: { user_id: id } });
    res.status(200).json({ message: "ລຶບຂໍ້ມູນສຳເລັດ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. ເຂົ້າລະບົບ (Login)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await models.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Email ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login Successful",
      access_token: token,
      data: {
        id: user.user_id,
        name: user.full_name,
        role: user.role
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. ປ່ຽນລະຫັດຜ່ານ
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(password, salt);

    await models.User.update(
      { password: passwordHash },
      { where: { user_id: id } }
    );

    res.status(200).json({ message: "ປ່ຽນລະຫັດຜ່ານສຳເລັດ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};