const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart
const Product = db.Product
const dottie = require('dottie')

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      include: 'items',
    }).then(orders => {
      console.log('orders:', JSON.parse(JSON.stringify(orders)))
      orders = JSON.parse(JSON.stringify(orders))
      return res.render('orders', { orders })
    })
  },
  postOrder: (req, res) => {
    return Cart.findByPk(req.body.cartId, {
      include: 'items',
      // raw: true,  //items會被攤平到cart..
      // nest: true
    })
      .then(cart => {
        console.log('postOrder - from cart: ', cart)
        return Order.create({
          name: req.body.name,
          phone: req.body.phone,
          address: req.body.address,
          payment_status: req.body.payment_status,
          shipping_status: req.body.shipping_status,
          amount: req.body.amount
        })
          .then(order => {

            let results = []
            for (let i = 0; i < cart.items.length; i++) {
              results.push(OrderItem.create({
                OrderId: order.id,
                price: cart.items[i].price,
                quantity: cart.items[i].CartItem.quantity,
                ProductId: cart.items[i].id
              }))
            }
            return Promise.all(results)
              .then(() => {
                return res.redirect('/orders')
              })
          })
      })
  },
  cancelOrder: (req, res) => {
    return Order.findByPk(req.params.id)
      .then(order => {
        console.log(req.body)
        order.update({
          ...req.body,
          payment_status: '-1',   //為何使用字串?
          shipping_status: '-1',
        })
          .then(order => {
            return res.redirect('back')
          })
      })
  }
}

module.exports = orderController