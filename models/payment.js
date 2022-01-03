'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Payment.belongsTo(models.Order)
    }
  };
  Payment.init({
    OrderId: DataTypes.INTEGER,
    sn: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    payment_method: DataTypes.STRING,
    paid_at: DataTypes.DATE,
    params: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};