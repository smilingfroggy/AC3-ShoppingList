'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsToMany(models.Cart, {
        through: {
          model: models.CartItem,
          unique: false
        },
        foreignKey: 'ProductId',
        as: 'carts'
      })
      Product.belongsToMany(models.Order, {
        through: {
          model: models.Order,
          unique: false
        },
        foreignKey: 'ProductId',
        as: 'orders'
      })
    }
  };
  Product.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};