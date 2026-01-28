require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const products = [
    {
        name: "Old Durbar Black Chimney",
        description: "Premium Nepali Whiskey known for its smooth smoky flavor.",
        price: 2800,
        image: "https://ik.imagekit.io/2bx99wcoe/old_durbar_black.jpg",
        stock: 50,
        approved: true,
        category: "Whiskey"
    },
    {
        name: "Gorkha Beer Strong",
        description: "Strong Nepali beer with a crisp taste.",
        price: 350,
        image: "https://ik.imagekit.io/2bx99wcoe/gorkha_beer.jpg",
        stock: 100,
        approved: true,
        category: "Beer"
    },
    {
        name: "Khukri XXX Rum",
        description: "The classic taste of Nepal. Award-winning dark rum.",
        price: 2100,
        image: "https://ik.imagekit.io/2bx99wcoe/khukrika_rum.jpg",
        stock: 45,
        approved: true,
        category: "Rum"
    },
    {
        name: "Ruslan Vodka",
        description: "Nepal's favorite clear vodka, perfect for cocktails.",
        price: 1800,
        image: "https://ik.imagekit.io/2bx99wcoe/ruslan_vodka.jpg",
        stock: 60,
        approved: true,
        category: "Vodka"
    },
    {
        name: "Jack Daniel's Old No. 7",
        description: "Classic Tennessee Whiskey.",
        price: 6500,
        image: "https://ik.imagekit.io/2bx99wcoe/jack_daniels.jpg",
        stock: 20,
        approved: true,
        category: "Whiskey"
    },
    {
        name: "Tuborg",
        description: "Premium lager beer.",
        price: 380,
        image: "https://ik.imagekit.io/2bx99wcoe/tuborg.jpg",
        stock: 120,
        approved: true,
        category: "Beer"
    },
    {
        name: "Blue Label",
        description: "Johnnie Walker Blue Label is an unrivaled masterpiece.",
        price: 35000,
        image: "https://ik.imagekit.io/2bx99wcoe/blue_label.jpg",
        stock: 5,
        approved: true,
        category: "Whiskey"
    },
    {
        name: "Golden Oak",
        description: "Smooth blend of malts and grain spirits.",
        price: 1400,
        image: "https://ik.imagekit.io/2bx99wcoe/golden_oak.jpg",
        stock: 80,
        approved: true,
        category: "Whiskey"
    },
    {
        name: "Carlsberg",
        description: "Probably the best beer in the world.",
        price: 400,
        image: "https://ik.imagekit.io/2bx99wcoe/carlsberg.jpg",
        stock: 90,
        approved: true,
        category: "Beer"
    },
    {
        name: "Divine Wine",
        description: "Sweet red wine from Nepal.",
        price: 900,
        image: "https://ik.imagekit.io/2bx99wcoe/divine_wine.jpg",
        stock: 40,
        approved: true,
        category: "Wine"
    }
];

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Connected to MongoDB ---');

        // Clear existing products
        console.log('Clearing existing products...');
        await Product.deleteMany({});

        // Insert new products
        console.log('Seeding products...');
        await Product.insertMany(products);

        console.log('--- Data Seeded Successfully ---');
        console.log(`Seeded ${products.length} products.`);

    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('--- Disconnected ---');
    }
}

seedData();
