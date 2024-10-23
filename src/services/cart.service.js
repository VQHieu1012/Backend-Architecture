'use strict'

const { cart } = require("../models/cart.model");
const { getProductById } = require("../models/repositories/product.repo");

/*
    Key features: Cart Service
    - add product to cart [user]
    - reduce product quantity by one [user]
    - increase product quantity
    - delete cart [user]
    - delete cart item [user]
*/

class CartService {

    // START REPO CART
    static async createUserCart({userId, product}){
        const query = { cart_userId: userId, cart_state: 'active' },
        updateOrInsert = {
            $addToSet: {
                cart_products: product
            }
        },
        options = { upsert: true, new: true}

        return await cart.findOneAndUpdate( query, updateOrInsert, options )
    }

    static async updateUserCartQuantity({userId, product}){
        const { productId, quantity } = product;
        const query = { cart_userId: userId,
            'cart_products.productId': productId,
            cart_state: 'active'
        }, updateSet = {
            $inc: {
                'cart_product.$.productId': quantity
                // tim kiem productId co trong cart_products.productId hay khong, $ the hien viec update chinh phan tu do
            }
        }, options = {upsert: true, new: true}

        return await cart.findOneAndUpdate( query, upsertOrInsert, options )
    }
    // END REPO CART
    static async addToCart({ userId, product = {} }){
        // check cart if it exists
        const userCart = await cart.findOne({
            cart_userId: userId
        })

        if (!userCart){
            return await CartService.createUserCart({ userId, product })
        }

        // cart exists but doesn't have any product
        if (userCart.cart_products.length){
            userCart.cart_products = [product]
            return await userCart.save()
        }

        // if cart exist and has this product, update quantity
        return await CartService.updateUserCartQuantity({userId, product})
    }

    // update cart
    /*
        shop_order_ids: [
            {
                shopId,
                item_products: [
                    {
                    quantity,
                    price,
                    shopId,
                    old_quantity:,
                    productId
                    }
                ],
                version: 
            }
        ]
    */

    static async addToCartV2({ userId, product={} }){
        const {productId, quantity, old_quantity } = shop_order_ids[0]?.item_products[0]
        // check product
        const foundProduct = await getProductById(productId)
        if (!foundProduct) throw new NotFoundError('Product not exists!')
        // compare
        if(foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
            throw new NotFoundError('Product doesn\'t belong to the shop')
        }
        if (quantity === 0){
            // delete
        }

        return await CartService.updateUserCartQuantity({
            userId,
            product: {
                productId,
                quantity: quantity - old_quantity
            }
        })
    }
}

module.exports = CartService