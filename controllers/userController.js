const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const models = require("../models/index");
require("dotenv").config();
exports.index = async (req, res, next) => {
  // const users = await models.User.findAll() // select * form User

  // const users = await models.User.findAll({
  //   //   attributes: ["id", "name", "email", "created_at"], // select field
  //   attributes: ["id", "name", ["email", "username"], "created_at"], // change field email as username
  //   // attributes: { exclude: ["password"] },
  //   // where: {
  //   //   email: "khamla@gmail.com", //select where
  //   // },
  //   order: [["id", "desc"]],
  // });

  // write sql by self
  const sql = "select id,name,email,created_at from users order by id desc";
  const users = await models.sequelize.query(sql, {
    type: models.sequelize.QueryTypes.SELECT,
  });

  res.status(200).json({
    message: "success",
    data: users,
  });
};
exports.userbyid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await models.User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "success",
      data: user,
    });
  } catch (error) {
    return res.status(error.statusCode).json({
      message: error.message,
      data: [],
    });
  }
};
// Insert data
exports.insert = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // check duplicate email
    const existEmail = await models.User.findOne({ where: { email: email } });

    if (existEmail) {
      const error = new Error("Duplicate email please try new email");
      error.statusCode = 400;
      throw error;
    }

    /// has password
    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(password, salt);

    const user = await models.User.create({
      name,
      email,
      password: passwordHash,
    });
    res.status(201).json({
      message: "success inserted",
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(error.statusCode).json({
      message: error.message,
      data: [],
    });
  }
};
// Update data
exports.update = async (req, res, next) => {
  try {
    const { id, name, email, password } = req.body;

    if (req.params.id !== id) {
      const error = new Error("ລະຫັດຜູ້ໃຊ້ບໍຖືກຕ້ອງ");
      error.statusCode = 400;
      throw error;
    }
    /// has password
    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(password, salt);

    const user = await models.User.update(
      {
        name,
        email,
        password: passwordHash,
      },
      {
        where: {
          id: id,
        },
      }
    );
    res.status(201).json({
      message: "user has been success updated",
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(error.statusCode).json({
      message: error.message,
      data: [],
    });
  }
};
//destory
exports.destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await models.User.findByPk(id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    await models.User.destroy({
      where: {
        id: id,
      },
    });

    res.status(201).json({
      message: "user has been success deleted",
    });
  } catch (error) {
    return res.status(error.statusCode).json({
      message: error.message,
      data: [],
    });
  }
};
//Authen
exports.login = async (req, res, next) => {
  try {
    if (req.body.password && req.body.email) {
      let user = await models.User.findOne({
        where: { email: req.body.email },
      });

      if (!user) {
        return res
          .status(400)
          .send({ message: "User does not exist", success: false });
      }
      const isMatch = await bcryptjs.compare(req.body.password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .send({ message: "Password is incorrect", success: false });
      } else {
        const JWT_SECRET = process.env.JWT_SECRET;
        // console.log("JWT_SECRET", JWT_SECRET);

        const token = jwt.sign(
          { id: user.id, username: user.name },
          JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );
        res.status(200).send({
          message: "Login Successful",
          success: true,
          access_token: token,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { id, password } = req.body;

    // Validate user ID
    if (parseInt(req.params.id) !== id) {
      const error = new Error("ລະຫັດຜູ້ໃຊ້ບໍ່ຖືກຕ້ອງ");
      error.statusCode = 400;
      throw error;
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(8);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Update only password field
    const [updated] = await models.User.update(
      { password: passwordHash },
      {
        where: { id },
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "ບໍ່ພົບຜູ້ໃຊ້",
        data: [],
      });
    }

    res.status(200).json({
      message: "ປ່ຽນລະຫັດຜ່ານສຳເລັດ",
      data: { id },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Server error",
      data: [],
    });
  }
};
