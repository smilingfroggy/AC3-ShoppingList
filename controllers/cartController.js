const db = require('../models')
const Cart = db.Cart

const cartController = {
  getCart: (req, res) => {
    Cart.findOne({
      include: 'items'  //items: [ Product {...,CartItem: {} } ]
    }).then(cart => {
      console.log(cart)
      let totalPrice = cart.items.length > 0 ? cart.items.map(d => d.CartItem.quantity * d.price).reduce((a, b) => a + b) : 0
      console.log(totalPrice)
      return res.render('cart', {
        cart: cart.toJSON(), totalPrice
      })
    })
  } 
}

module.exports = cartController