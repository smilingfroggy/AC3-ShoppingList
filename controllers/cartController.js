const db = require('../models')
const Cart = db.Cart
const CartItem = db.CartItem

const cartController = {
  getCart: (req, res) => {
    Cart.findByPk( req.session.cartId, {
      include: 'items'  //items: [ Product {...,CartItem: {} } ]
    }).then(cart => {
      console.log(cart)
      cart = cart || { items: [] } // findByPk找不到時回傳null
      let totalPrice = cart.items.length > 0 ? cart.items.map(d => d.CartItem.quantity * d.price).reduce((a, b) => a + b) : 0
      console.log('totalPrice: ',totalPrice)
      return res.render('cart', {
        cart: cart.toJSON(), totalPrice
      })
    })
  },
  postCart: (req, res) => {
    return Cart.findOrCreate({
      where: {
        id: req.session.cartId || 0
      }
    }).then( ([cart, created]) => {
      return CartItem.findOrCreate({
        where: {
          CartId: cart.id,
          ProductId: req.body.productId
        }
      }).then( ([cartItem, created]) => {
        return cartItem.update({
          quantity: (cartItem.quantity || 0) + 1
        })
          .then((cartItem) => {
            req.session.cartId = cart.id  // 若新建立cart
            return req.session.save(() => {
              return res.redirect('back')
            })
          })
      })
    })
  }
}

module.exports = cartController