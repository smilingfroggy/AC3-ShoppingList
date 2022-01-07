const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart
const nodemailer = require('nodemailer')

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ACCOUNT,
    pass: process.env.GMAIL_PASSWORD
  }
})

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
            // 準備將cart內容複製到order(CartItem到OrderItem)
            let results = []
            for (let i = 0; i < cart.items.length; i++) {
              results.push(OrderItem.create({
                OrderId: order.id,
                price: cart.items[i].price,
                quantity: cart.items[i].CartItem.quantity,
                ProductId: cart.items[i].id
              }))
            }
            // 寄出確認信
            const mailOptions = {
              from: `Jennifer <${process.env.GMAIL_ACCOUNT}>`,
              to: 'jenniferh6603+AC@gmail.com',
              subject: `編號${order.id} 訂單成立`,
              text: `編號${order.id} 訂單成立`
            }
            mailTransport.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error)
              } else {
                console.log(`Email sent: ${info.response}`)
              }
            })

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
  },
  getPayment: (req, res) => { //
    console.log('going to pay orderId:', req.params.id)
    Order.findByPk(req.params.id)
      .then(order => {
        order = order.toJSON()
        return res.render('payment', { order })
      })
  },
  newebpayCallback: (req, res) => { //接收來自藍新的 交易支付系統回傳參數
    console.log('newebpayCallback req.body', req.body)
    return res.redirect('back')
  },
}

module.exports = orderController