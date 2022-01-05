const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart
const Product = db.Product
const dottie = require('dottie')

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      // raw: true,  // orders, items OK 但OrderItem還是[Object]
      // nest: true,  // items還是被攤平到orders，變成每個order一個items & product
      include: 'items',
      // include: { model: Product, as: 'items' }  // 結果同上
    }).then(orders => {
      console.log('orders:', JSON.parse(JSON.stringify(orders)))
      orders = JSON.parse(JSON.stringify(orders))
      return res.render('orders', { orders })
    })
  }
}

module.exports = orderController