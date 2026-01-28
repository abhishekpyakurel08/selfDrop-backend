require('dotenv').config();
const mongoose = require('mongoose');
const Area = require('./models/Area');

const areas = [
    { name: 'new-baneshwor', displayName: 'New Baneshwor' },
    { name: 'pashupatinath', displayName: 'Pashupatinath Temple' },
    { name: 'boudhanath', displayName: 'Boudhanath Stupa' },
    { name: 'swayambhunath', displayName: 'Swayambhunath' },
    { name: 'thapathali-newroad', displayName: 'Thapathali / New Road' },
    { name: 'gokarna', displayName: 'Gokarna Forest & Temple' },
    { name: 'patan-durbar', displayName: 'Lalitpur / Patan Durbar Square' },
    { name: 'koteshwor', displayName: 'Koteshwor' },
    { name: 'teku-chowk', displayName: 'Teku Chowk / Bagmati area' },
    { name: 'chabahil', displayName: 'Chabahil / Ganesh Temple' },
    { name: 'kumaripati-jawalakhel', displayName: 'Kumaripati / Jawalakhel' },
    { name: 'gairidhara-lazimpat', displayName: 'Gairidhara / Lazimpat' },
    { name: 'kamalpokhari', displayName: 'Kamalpokhari' },
    { name: 'bhaktapur-durbar', displayName: 'Bhaktapur Durbar Square', maxDistanceKm: 7 }
];

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
