const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/product', productController.getProduct)
router.get('/cart', cartController.getCart)
router.post('/cart', cartController.postCart)

module.exports = router;
