'use strict'

const CartService = require("../services/cart.service");
const { SuccessResponse } = require('../core/success.response')

class CartController {
    addToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Cart Success!',
            metadata: await CartService.addToCart( req.body )
        }).send(res)
    }

    // update + -
    update = async (req, res, next) => {
        // new
        new SuccessResponse({
            message: 'Create new Cart success!',
            metadata: await CartService.addToCartV2( req.body )
        }).send(res)
    }

    delete = async (req, res, next) => {
        new SuccessResponse({
            message: 'delete Cart Success!',
            metadata: await CartService.deleteUserCart( req.body )
        }).send(res)
    }

    listToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'List Cart success!',
            metadata: await CartService.getListUserCart( req.query )
        }).send(res)
    }
    
    


}

module.exports = new CartController()