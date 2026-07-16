const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Hash password manually — bypass pre-save hook
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('PCN@2024#Secure', salt);

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existing = await usersCollection.findOne({ username: 'pcnamkeen' });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Insert directly into collection
    await usersCollection.insertOne({
      username: 'pcnamkeen',
      password: hashedPassword,
      email: process.env.RESET_EMAIL,
      refreshTokens: [],
      resetOTP: { code: null, expiry: null },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: pcnamkeen');
    console.log('Password: PCN@2024#Secure');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seed();