const mongoose = require('mongoose');
const dotenv = require('dotenv');
const products = require('./data/products');
const areas = require('./data/areas');
const Product = require('./models/Product');
const Area = require('./models/Area');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        await Product.deleteMany(); // Clear existing

        // Add approved: true to ensure they are visible in queries that filter by approved status
        const sampleProducts = products.map(product => {
            return { ...product, approved: true };
        });

        await Product.insertMany(sampleProducts);

        await Area.deleteMany();
        await Area.insertMany(areas);

        console.log('20 Products and Areas Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await Product.deleteMany();
        await Area.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
