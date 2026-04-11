require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: String,
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email    = process.argv[2] || "admin@linkafrica.com";
  const password = process.argv[3] || "Admin@2233";
  const name     = process.argv[4] || "Platform Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    await User.findOneAndUpdate({ email }, { role: "admin" });
    console.log(`Updated ${email} to admin role`);
  } else {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role: "admin" });
    console.log(`Admin created: ${email} / ${password}`);
  }

  mongoose.disconnect();
}

createAdmin().catch(console.error);
