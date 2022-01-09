const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ACCOUNT,
    pass: process.env.GMAIL_PASSWORD
  }
})

const URL = process.env.URL
const MerchantID = process.env.MERCHANT_ID
const HashKey = process.env.HASH_KEY
const HashIV = process.env.HASH_IV
const NewebPay = "https://ccore.newebpay.com/MPG/mpg_gateway"
const ReturnURL = URL + "/newebpay/callback?from=ReturnURL" //完成後將使用者導回商店頁面
const NotifyURL = URL + "/newebpay/callback?from=NotifyURL" //讓藍新回傳給後端 交易結果
const ClientBackURL = URL + "/orders"

function getDataChain(TradeInfo) {
  let results = []
  for (const [key, value] of Object.entries(TradeInfo)) {
    results.push(`${key}=${value}`)
  }
  return results.join("&")
}

function create_mpg_aes_encrypt(TradeInfo) {  // 加密
  let encrypt = crypto.createCipheriv('aes256', HashKey, HashIV)
  let enc = encrypt.update(getDataChain(TradeInfo), 'utf8', 'hex')
  return enc + encrypt.final('hex')
}

function create_mpg_aes_decrypt(TradeInfo) {  // 解密
  let decrypt = crypto.createDecipheriv('aes256', HashKey, HashIV)
  decrypt.setAutoPadding(false)
  let text = decrypt.update(TradeInfo, 'hex', 'utf8')
  let plainText = text + decrypt.final('utf8')
  let result = plainText.replace(/[\x00-\x20]+/g, "")
  return result
}

function create_mpg_sha_encrypt(TradeInfo) {  // 雜湊處理
  let sha = crypto.createHash('sha256')
  let plainText = `HashKey=${HashKey}&${TradeInfo}&HashIV=${HashIV}`
  return sha.update(plainText).digest('hex').toUpperCase()
}

function getTradeInfo(Amt, Desc, email) {
  const data = {
    MerchantID: MerchantID,
    RespondType: 'JSON',
    TimeStamp: Date.now(),
    Version: '2.0',
    LangType: 'zh-tw',
    MerchantOrderNo: Date.now(),
    Amt: Amt,
    ItemDesc: Desc,
    Email: email,
    LoginType: 0,
    OrderComment: 'OrderComment',
    ReturnURL: ReturnURL,
    NotifyURL: NotifyURL,
    ClientBackURL: ClientBackURL
  }

  console.log('===== getTradeInfo =====')
  console.log(Amt, Desc, email)
  console.log('==========')

  const mpg_aes_encrypt = create_mpg_aes_encrypt(data)
  const mpg_sha_encrypt = create_mpg_sha_encrypt(mpg_aes_encrypt)

  console.log('===== getTradeInfo: mpg_aes_encrypt, mpg_sha_encrypt =====')
  console.log(mpg_aes_encrypt)
  console.log(mpg_sha_encrypt)

  const tradeInfo = {
    MerchantID: MerchantID,
    TradeInfo: mpg_aes_encrypt,
    TradeSha: mpg_sha_encrypt,
    Version: 2.0,
    NewebPay: NewebPay,
    MerchantOrderNo: data.MerchantOrderNo //存入DB用於比對、更新交易狀態
    // EncryptType:
  }
  console.log('===== getTradeInfo: tradeInfo =====')
  console.log(tradeInfo)
  return tradeInfo
}

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
  getPayment: (req, res) => { //點選立即付款
    console.log('going to pay orderId:', req.params.id)
    return Order.findByPk(req.params.id)
      .then(order => {
        console.log('# ', req.params.id, 'order', order.toJSON())
        const tradeInfo = getTradeInfo(order.amount, '產品名稱', 'jenniferh6603@gmail.com')
        console.log('tradeInfo.MerchantOrderNo:', tradeInfo.MerchantOrderNo)        
        order.update({
          id: req.params.id,
          sn: tradeInfo.MerchantOrderNo //成立時間搓記，用於比對交付款資訊
        }).then(order => {
          return res.render('payment', { order, tradeInfo })
        }).catch(error => {
          console.log(error)
        })
      })
  },
  newebpayCallback: (req, res) => { //接收來自藍新的 交易支付系統回傳參數
    console.log('===== newebpayCallback =====')
    console.log('newebpayCallback req.method', req.method)
    console.log('newebpayCallback req.query', req.query)
    console.log('newebpayCallback req.body', req.body)

    const data = JSON.parse(create_mpg_aes_decrypt(req.body.TradeInfo))
    console.log('===== decrypt(req.body.TradeInfo) =====')
    console.log(data)

    Order.findOne({
      where: {
        sn: data.Result.MerchantOrderNo
      }
    }).then(order => {
      console.log(`MerchantOrderNo ${data.Result.MerchantOrderNo} order:`, order)
      order.update({
        payment_status: 1
      }).then(order => {
        return res.redirect('/orders')
      })
    }).catch(error => {
      console.log(error)
    })
  },
}

module.exports = orderController