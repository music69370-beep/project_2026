const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const models = require("../models/index");
const { Op } = require("sequelize"); // ✅ ປະກາດໄວ້ແຖວເທິງສຸດຄັ້ງດຽວ
require("dotenv").config();

// 1. ດຶງຂໍ້ມູນ User ທັງໝົດ
exports.index = async (req, res, next) => {
  try {
    const users = await models.User.findAll({
      attributes: { exclude: ["password"] }, // ບໍ່ຄວນສົ່ງ password ອອກໄປ
    });
    res.status(200).json({
      message: "success",
      count: users.length,
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
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ message: "ບໍ່ພົບຜູ້ໃຊ້" });
    res.status(200).json({ message: "success", data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. ເພີ່ມຂໍ້ມູນ User (Register)
exports.insert = async (req, res, next) => {
  try {
    const { full_name, email, password, role, department } = req.body;

    // ກວດເຊັກທັງ Email ແລະ ຊື່ ຫ້າມຊ້ຳ
    const existUser = await models.User.findOne({
      where: { [Op.or]: [{ email }, { full_name }] }
    });

    if (existUser) {
      return res.status(400).json({ message: "Email ຫຼື ຊື່ນີ້ມີຜູ້ນໍາໃຊ້ແລ້ວ" });
    }

    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(password, salt);

    const user = await models.User.create({
      full_name,
      email,
      password: passwordHash,
      role: role || 'user',
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

// 6. ເຂົ້າລະບົບ (Login) - 🛠 ແກ້ໄຂໃຫ້ສົມບູນ
exports.login = async (req, res, next) => {
  try {
    const { identity, password } = req.body;
    
    // ຕັດຍະຫວ່າງ
    const loginIdentity = identity ? identity.trim() : "";

    // 1. ຊອກຫາ User ຈາກ Email ຫຼື Full Name
    const user = await models.User.findOne({
      where: {
        [Op.or]: [
          { email: loginIdentity },
          { full_name: loginIdentity }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: "ຊື່ຜູ້ໃຊ້/Email ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" });
    }

    // 2. ກວດເຊັກ Password (ສ່ວນທີ່ຫາຍໄປໃນ Code ເຈົ້າ)
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "ຊື່ຜູ້ໃຊ້/Email ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" });
    }

    // 3. ສ້າງ Token
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

// 7. ປ່ຽນລະຫັດຜ່ານ, Update, Destroy (ໃຊ້ user_id ໃຫ້ຖືກຕ້ອງ)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    await models.User.update(req.body, { where: { user_id: id } });
    res.status(200).json({ message: "ອັບເດດຂໍ້ມູນສຳເລັດ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;
    await models.User.destroy({ where: { user_id: id } });
    res.status(200).json({ message: "ລຶບຂໍ້ມູນສຳເລັດ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(req.body.password, salt);
    await models.User.update({ password: passwordHash }, { where: { user_id: id } });
    res.status(200).json({ message: "ປ່ຽນລະຫັດຜ່ານສຳເລັດ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};