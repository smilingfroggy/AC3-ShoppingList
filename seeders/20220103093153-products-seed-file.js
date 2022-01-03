'use strict';
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Products', 
      Array.from({ length: 10 }).map((item, index) => ({
        id: index + 1,
        name: faker.commerce.productName(),
        description: faker.commerce.product() + '/' + faker.commerce.productName(),
        price: faker.commerce.price(),
        image: `https://loremflickr.com/640/480/product?lock=${index+1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      , {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {})
  }
};
