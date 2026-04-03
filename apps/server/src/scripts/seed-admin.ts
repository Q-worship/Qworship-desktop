import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url for "__dirname" equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../modules/auth/auth.model.js';
import { connectDB } from '../core/db.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = 'superadmin@qworship.com';
    const password = 'QworshipAdmin2026!';

    // Check if superadmin exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Superadmin already exists. Exiting script.');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create superadmin
    const superAdmin = new User({
      username: email,
      email,
      password: hashedPassword,
      firstName: 'Q-worship',
      lastName: 'Superadmin',
      role: 'superadmin',
      isActive: true,
      emailVerified: true
    });

    await superAdmin.save();

    console.log('Superadmin seeded successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedAdmin();
