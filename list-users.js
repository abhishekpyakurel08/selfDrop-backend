require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function listAll() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
        console.log(`- ${u.name} (${u.email}) [${u.role}]`);
    });
    process.exit();
}

listAll();
