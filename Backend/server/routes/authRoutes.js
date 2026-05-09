const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// SIGNUP

router.post("/signup", async (req, res) => {

   try {

      const { name, email, password } = req.body;

      // Check existing user

      const existingUser = await User.findOne({ email });

      if (existingUser) {
         return res.status(400).json({
            message: "User already exists"
         });
      }

      // Hash password

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user

      const user = new User({
         name,
         email,
         password: hashedPassword
      });

      await user.save();

      res.status(201).json({
         message: "User registered successfully"
      });

   } catch (error) {

      res.status(500).json({
         error: error.message
      });

   }

});



// LOGIN

router.post("/login", async (req, res) => {

   try {

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
         return res.status(400).json({
            message: "User not found"
         });
      }

      // Compare password

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
         return res.status(400).json({
            message: "Invalid credentials"
         });
      }

      // Generate token

      const token = jwt.sign(
         { id: user._id },
         process.env.JWT_SECRET,
         { expiresIn: "7d" }
      );

      res.status(200).json({
         token,
         user
      });

   } catch (error) {

      res.status(500).json({
         error: error.message
      });

   }

});

module.exports = router;