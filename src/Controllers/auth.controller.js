const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 📌 Register endpoint: Creates a new user
const register = async (req, res) => {
  console.log("Email created successfully");   // 👈 Logs when register is called
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ 
        success:false, 
        message: 'username, email and password required' 
      });

    const existing = await User.findOne({ $or: [ { email }, { username } ] });
    if (existing)
      return res.status(409).json({ 
        success:false, 
        message: 'user already exists' 
      });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();

    // ✅ include role: "user" in token
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success:true, 
      data:{ token }, 
      message: 'registered' 
    });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ 
      success:false, 
      message: err.message 
    });
  }
};

// 📌 Login endpoint: Authenticates a user and returns a JWT token
const login = async (req, res) => {
  console.log("Email logged in successfully");   // 👈 Logs when login is called
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "email and password required",
      });

    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    // ✅ include role: "user" in token
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, data: { token } });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 📌 Me endpoint: Returns the authenticated user’s profile
const me = async (req, res) => {
  console.log("Email authenticated successfully");   // 👈 Logs when me is called
  try {
    const id = req.user && req.user._id;
    if (!id)
      return res.status(401).json({
        success:false,
        message: 'Unauthorized'
      });

    const user = await User.findById(id).select('-password');
    res.json({ 
      success:true, 
      data: user 
    });
  } catch (err) {
    res.status(500).json({ 
      success:false, 
      message: err.message 
    });
  }
};

// ✅ Corrected export
module.exports = { register, login, me };
