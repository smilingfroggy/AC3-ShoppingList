const db = require('../models')
const Cart = db.Cart
const CartItem = db.CartItem

const cartController = {
  getCart: (req, res) => {
    Cart.findByPk(req.session.cartId, {
      include: 'items'  //items: [ Product {...,CartItem: {} } ]
    }).then(cart => {
      cart = cart ? cart.toJSON() : { items: [] }  //findByPk找不到時回傳null
      let totalPrice = cart.items.length > 0 ? cart.items.map(d => d.CartItem.quantity * d.price).reduce((a, b) => a + b) : 0
      return res.render('cart', { cart, totalPrice })
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
  },
  addCartItem: (req, res) => {
    CartItem.findByPk(req.params.id)
      .then(cartItem => {
        cartItem.update({
          quantity: cartItem.quantity + 1
        })
          .then(cartItem => {
            return res.redirect('back')
          })
      })
  },
  subCartItem: (req, res) => {
    CartItem.findByPk(req.params.id)
      .then(cartItem => {
        cartItem.update({
          quantity: cartItem.quantity - 1 >= 1 ? cartItem.quantity - 1 : 1
          // 最小數量為 1
        })
          .then(cartItem => {
            return res.redirect('back')
          })
      })
  },
  deleteCartItem: (req, res) => {
    CartItem.findByPk(req.params.id)
      .then(cartItem => {
        cartItem.destroy()
          .then(cartItem => {
            return res.redirect('back')
          })
      })
  }
}

module.exports = cartController