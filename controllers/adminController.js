const bcrypt = require("bcrypt");
const Admin = require("./../models/admin.js");
const User = require("./../models/user.js")
const config = require("./../config/config.js");
const { sendWelcomeEmail } = require("./../email/sendemail.js")
const jwt = require("jsonwebtoken");

const createAdmin = async (req, res) => {
  try {
    const { name, email, phoneNo, password, address } = req.body;

    const ifExits = await Admin.findOne({ $or: [{ email }, { phoneNo }] });
    if (ifExits) return res.status(400).send("admin already exits..");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      name,
      email,
      phoneNo,
      password: hashedPassword,
      address,
    });
    await admin.save();
    return res
      .status(200)
      .json({ message: "admin registration successfully", admin: admin });
  } catch (error) {
    console.error("error", error);
  }
}

const loginAdmin = async (req, res) => {
  try {
    const { email, phoneNo, password } = req.body;
    const admin = await Admin.findOne({ $or: [{ email }, { phoneNo }] });
    if (!admin) return res.status(400).send("Bad request");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).send("send invalid password");

    const token = jwt.sign({ admin: { id: admin.id } }, config.jwtSecret, {
      expiresIn: "24h",
    });
    res.json({ admin, token });
  } catch (error) {
    console.error(error);
  }
}


const getAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).send("admin not found");

    res.status(200).json({ message: "admin get sucessfully", admin: admin });
  } catch (err) {
    console.error(err);
  }
}

const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { name, email, phoneNo, password, address } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).send("admin not found");

    const updateadmin = {
      name,
      email,
      phoneNo,
      address,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateadmin.password = hashedPassword;
    }
    const result = await Admin.findByIdAndUpdate(adminId, updateadmin, { new: true });
    if (result) return res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
}

const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).send("Not found");

    await admin.deleteOne();
    return res.status(200).send("deleted");
  } catch (error) {
    console.error(error);
  }
}


const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, phoneNo, password, role } = req.body;

    const ifExits = await User.findOne({ $or: [{ email }, { phoneNo }] });
    if (ifExits) return res.status(400).json({ message: "User already Exists..." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      phoneNo,
      password: hashedPassword,
      role
    });
    await user.save();
    await sendWelcomeEmail(user.email, user.name, password);
    return res
      .status(200)
      .json({ message: "user registration successfully", user: user });
  } catch (error) {
    console.error("error", error);
  }
}


module.exports = {
  createAdmin,
  loginAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  createUserByAdmin
};
