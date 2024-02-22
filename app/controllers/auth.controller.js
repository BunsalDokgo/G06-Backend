const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  // Save User to Database
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    // if (req.body.roles) {
    //   const roles = await Role.findAll({
    //     where: {
    //       name: {
    //         [Op.or]: req.body.roles,
    //       },
    //     },
    //   });

    //   const result = user.setRoles(roles);
    //   if (result) res.send({ message: "User registered successfully!" });
    // } else {
    //   // user has role = 1
    //   const result = user.setRoles([1]);
    //   if (result) res.send({ message: "User registered successfully!" });
    // }
    res.send({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "Incorrect user or password!" });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign({ id: user.id },
                config.secret,
                {
                  algorithm: 'HS256',
                  allowInsecureKeySizes: true,
                  expiresIn: 86400, // 24 hours
                }
              );

    let authorities = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }

    req.session.token = token;

    return res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      message: 'login successfully !'
    });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!"
    });
  } catch (err) {
    this.next(err);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id, currentPwd, newPwd, confirmNewPwd } = req.body;

    const user = await User.findOne({ where: { id } });

    if (!user) {
      return res.status(404).send({ message: "Invalid user or password!" });
    }

    const passwordIsValid = bcrypt.compareSync(
      currentPwd,
      user.password
    );

    if (passwordIsValid) {
      const newPasswordIsValid = newPwd === confirmNewPwd;
      if (newPasswordIsValid) {
        user.password = bcrypt.hashSync(newPwd, 8);
        await user.save();
        return res.status(200).send({
          message: "Password reset successfully !",
        })
      } else {
        return res.status(400).send({
          message: "New password doesn't match !",
        });
      }
    }

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.uploadProfile = async (req, res) => {
  try {
    const imagePath = req.file.path;
    const id = req.body.id;

    const user = await User.findOne({ _id: id });

    if (user) {
      user.imagePath = imagePath;
      await user.save();
      res.status(200).json({ 
        imagePath,
        message: 'Image uploaded successfully'
      });
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

exports.getImage = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ imagePath: user.imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}