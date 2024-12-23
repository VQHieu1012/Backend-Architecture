'use strict'

const ProductService = require("../services/product.service");
const ProductServiceV2 = require("../services/product.service.xxx");
const {SuccessResponse} = require('../core/success.response');

class ProductController {

    createProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Product !',
            metadata: await ProductServiceV2.createProduct(req.body.product_type, {
                ...req.body,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Product !',
            metadata: await ProductServiceV2.updateProduct(req.body.product_type, req.params.productId, {
                ...req.body,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    publishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Publish Product successfully!',
            metadata: await ProductServiceV2.publishProductByShop({
                product_shop: req.user.userId,
                product_id: req.params.id
            })
        }).send(res)
    }

    unPublishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'UnPublish Product successfully!',
            metadata: await ProductServiceV2.unPublishProductByShop({
                product_shop: req.user.userId,
                product_id: req.params.id
            })
        }).send(res)
    }

    // QUERY //
    /**
     * @description Get all Drafts for shop
     * @param {Number} limit
     * @param {Number} skip
     * @returns {JSON}
     */
    getAllDraftsForShop = async(req, res, next) => {
        new SuccessResponse({
            message: 'Get list Draft success !',
            metadata: await ProductServiceV2.findAllDraftsForShop({
                product_shop: req.user.userId
            })
        }).send(res)
    }

    getAllPublishForShop = async(req, res, next) => {
        new SuccessResponse({
            message: 'Get list Published success !',
            metadata: await ProductServiceV2.findAllPublishForShop({
                product_shop: req.user.userId
            })
        }).send(res)
    }

    getListSearchProduct = async(req, res, next) => {
        new SuccessResponse({
            message: 'Get list search success !',
            metadata: await ProductServiceV2.searchProducts( req.params )
        }).send(res)
    }

    findAllProducts = async(req, res, next) => {
        new SuccessResponse({
            message: 'findAllProducts success !',
            metadata: await ProductServiceV2.findAllProducts( req.query )
        }).send(res)
    }

    findProduct = async(req, res, next) => {
        new SuccessResponse({
            message: 'findProduct success !',
            metadata: await ProductServiceV2.findProduct( {
                product_id: req.params.product_id
            } )
        }).send(res)
    }
}

module.exports = new ProductController()
