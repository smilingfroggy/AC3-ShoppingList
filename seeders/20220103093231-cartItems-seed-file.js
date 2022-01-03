'use strict';
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('CartItems', 
      Array.from({ length: 10 }).map((item, index) => ({
        CartId: Math.floor(Math.random() * 3 ) + 1, //random: 1,2,3
        ProductId: Math.floor(Math.random() * 10) + 1, // random: 1~10
        quantity: Math.floor(Math.random() * 5) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    , {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('CartItems', null, {})
  }
};
