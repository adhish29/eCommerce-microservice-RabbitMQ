const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("./user");

const app = express();
const PORT = process.env.PORT || 7070;
const saltRounds = 10;

app.use(express.json());

async function connect() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      "mongodb+srv://adhishAdmin:adhish@surveycollect.s98mq.mongodb.net/auth-service?retryWrites=true&w=majority"
    );
    console.log("connected to auth-service DB");
  } catch (e) {
    console.log(e);
  }
}

connect();

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.json({ message: "User Already Exists" });
    //Encrypt user password
    else {
      const encryptedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password: encryptedPassword,
      });
      await newUser.save();
      const token = jwt.sign({ email, name }, "secretkey", { expiresIn: "2h" });
      newUser.token = token;
      return res.json(newUser);
    }
  } catch (e) {
    // console.log(e);
    res.json({ errorMessage: e.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!email || !password)
      return res.json({ message: "Please provide userName and password" });
    if (
      !user ||
      user.email !== email ||
      !(await bcrypt.compare(password, user.password))
    )
      return res.json({ message: "Invalid User Name or Password!!!" });
    else {
      const payLoad = {
        email,
        name: user.name,
      };
      const token = jwt.sign(payLoad, "secretkey", { expiresIn: "2h" });
      if (token) res.json({ token });
    }
  } catch (e) {
    console.log(e);
  }
});

app.listen(PORT, () =>
  console.log(`Auth Service id running at http://localhost:${PORT}`)
);
