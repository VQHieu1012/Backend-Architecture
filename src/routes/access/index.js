'use strict'

const express = require('express');
const accessController = require('../../controllers/access.controller');
const router = express.Router();
const {asyncHandler} = require('../../auth/checkAuth')

// signUp
console.log('Come to post api signup')
router.post('/shop/signup', asyncHandler(accessController.signUp))
router.post('/shop/login', asyncHandler(accessController.login))

//

module.exports = router