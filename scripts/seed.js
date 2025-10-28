require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Watch = require('../src/models/Watch');

async function seed() {
  await connectDB();
  await Watch.deleteMany({});

  const watches = [
    { name: 'Rolex Submariner', brand: 'Rolex', type: 'Luxury', price: 12000, description: 'Classic diving watch', image: '' },
    { name: 'Casio G-Shock', brand: 'Casio', type: 'Sport', price: 150, description: 'Rugged shock-resistant watch', image: '' },
    { name: 'Omega Speedmaster', brand: 'Omega', type: 'Luxury', price: 5500, description: 'Famous moonwatch', image: '' },
    { name: 'Seiko 5', brand: 'Seiko', type: 'Classic', price: 250, description: 'Affordable automatic', image: '' },
    { name: 'Apple Watch Series 9', brand: 'Apple', type: 'Smart', price: 399, description: 'Smartwatch', image: '' }
  ];

  await Watch.insertMany(watches);
  console.log('Watches seeded');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
