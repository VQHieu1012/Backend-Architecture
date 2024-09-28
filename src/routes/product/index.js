'use strict'

const express = require('express');
const productController = require('../../controllers/product.controller');
const router = express.Router();
const {asyncHandler} = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');

// authentication
router.use(authenticationV2)
router.post('', asyncHandler(productController.createProduct))

// QUERY //
router.get('/drafts/all', asyncHandler(productController.getAllDraftsForShop))
router.get('/published/all', asyncHandler(productController.getAllDraftsForShop))

module.exports = router