require('dotenv').config();
const mongoose = require('mongoose');
const Area = require('./models/Area');

const areas = require('./data/areas');

const seedAreas = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await Area.deleteMany({});
        console.log('Cleared existing areas');

        await Area.insertMany(areas);
        console.log('Seeded delivery areas successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding areas:', error);
        process.exit(1);
    }
};

seedAreas();
