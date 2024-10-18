'use strict'

const { model } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const discount = require("../models/discount.model");
const { findAllDiscountCodesUnSelect, findAllDiscountCodesSelect, checkDiscountExists } = require("../models/repositories/discount.repo");
const { findAllProducts } = require("../models/repositories/product.repo");
const {convertToObjectIdMongodb} = require("../utils");


/*
    Discount Services
    1 - Generator Discount Code [Shop | Admin]
    2 - Get discount amount [User]
    3 - Get all discount codes [User | Shop]
    4 - Verify discount code [Admin]
    5 - Delete discount code [Admin | Shop]
    6 - Cancel discount code [User]
*/

class DiscountService {

    static async createDiscountCode (payload) {
        const {
            code, start_date, end_date, is_active, users_used,
            shopId, min_order_value, product_ids, applies_to, name,
            description, type, value, max_value, max_uses, uses_count, max_uses_per_user
        } = payload

        // kiem tra
        if (new Date() < new Date(start_date) || new Date() > new Date(end_date)){
            throw new BadRequestError('Discount has expired!')
        }

        if (new Date(start_date) >= new Date(end_date)) throw new BadRequestError('Start date equals or greater then End date!')

        // create index for discount
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId)
        }).lean()

        if (foundDiscount && foundDiscount.discount_is_active) throw new BadRequestError('Discount exists!')
        
        const newDiscount = await discount.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_code: code,
            discount_value: value,
            discount_min_order_value: min_order_value || 0,
            discount_max_value: max_value,
            discount_start_date: new Date(start_date), // ngay bat dau
            discount_end_date: new Date(end_date),  // ngay ket thuc
            discount_max_uses: max_uses, // so luong discount duoc ap dung
            discount_uses_count: uses_count, // do discount da su dung
            discount_users_used: users_used,  // ai da dunng
            discount_shopId: shopId,
            discount_max_uses_per_user: max_uses_per_user, // so luong cho phep toi da su dung cho moi user
            discount_is_active: is_active,
            discount_applies_to: applies_to,
            discount_product_ids: applies_to === 'all' ? []: product_ids, // so san pham duoc ap dung
        })

        return newDiscount
    }

    static async updateDiscountCode() {
        // ...
    }

    /*
    Get all discount codes available with products
    */

    static async getAllDiscountCodesWithProduct({
        code, shopId, userId, limit, page
    }) {
        // create index for discount code
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId)
        }).lean()

        if (!foundDiscount || !foundDiscount.discount_is_active) {
            throw new NotFoundError('Discount not exists')
        }

        const { discount_applies_to, discount_product_ids } = foundDiscount
        let products
        if (discount_applies_to === 'all'){
            // get all products
            products = await findAllProducts({
                filter: {
                    product_shop: convertToObjectIdMongodb(shopId),
                    isPublished: true
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name']
            })
        }

        if (discount_applies_to === 'specific'){
            // get specific products ids
            products = await findAllProducts({
                filter: {
                    _id: {$in: discount_product_ids },
                    // product_shop: convertToObjectIdMongodb(shopId),
                    isPublished: true
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name']
            })
        }
        return products
    }

    /*
    Get all discount codes of shop
    */
    static async getAllDiscountCodesByShop ({
        limit, page, shopId
    }){
        const discounts = await findAllDiscountCodesUnSelect({
            limit: +limit,
            page: +page,
            filter: {
                discount_shopId: convertToObjectIdMongodb(shopId),
                discount_is_active: true
            },
            unSelect: ['__v', 'discount_shopId'],
            model: discount
        })
        return discounts
    }

    /*
        Apply Discount Code
        products = [
            {
                productId,
                shopId,
                quantity,
                name,
                price
            }, 
            {
                productId,
                shopId,
                quantity,
                name,
                price
            }
        ]
    */
    static async getDiscountAmount({ codeId, userId, shopId, products }){

        const foundDiscount = await checkDiscountExists({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId)
            } 
        })

        if (!foundDiscount) throw new NotFoundError('Discount doesn\'t exits')

        const {
            discount_is_active, discount_max_uses,
            discount_min_order_value, discount_uses_used,
            discount_max_uses_per_user
        } = foundDiscount

        if (!discount_is_active) throw new NotFoundError('Discount expired!')
        if (!discount_max_uses) throw new NotFoundError('Discount ends!')
        
        if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)){
            throw new NotFoundError('Discount expired!')
        }

        // check xem co gia tri toi thieu hay khong
        let totalOrder = 0
        if (discount_min_order_value > 0){
            // get total
            totalOrder = products.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            if (totalOrder < discount_min_order_value){
                throw new NotFoundError(`Discount requires a minimum order value of ${discount_min_order_value}!`)
            }
        }
        
        if (discount_max_uses_per_user > 0) {
            const userUserDiscount = discount_uses_used.find( user => user.userId === userId)

            if (userUserDiscount){
                //...
            }
        }

        // check discount la fixed_amount or percentage
        const amount = discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100)
        return {
            totalOrder,
            discount: amount,
            totalPrice: totalOrder - amount
        }
    }

    static async deleteDiscountCode({ shopId, codeId }){
        // const foundDiscount = '';
        // if(foundDiscount){
        //     // deleted
        // }
        const deleted = await discount.findOneAndDelete({
            discount_code: codeId,
            discount_shopId: shopId
        })

        return deleted
    }

    // user cancel discount code
    static async cancelDiscountCode({ codeId, shopId, userId }){
        const foundDiscount = await checkDiscountExists({
            model: discount,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId)
            }
        })

        if (!foundDiscount) throw new NotFoundError(`Discount doesn't exists!`)

        const result = await discount.findByIdAndUpdate( foundDiscount._id, {
            $pull: {
                discount_users_used: userId,
            },
            $inc: {
                discount_max_uses: 1,
                discount_users_used: - 1
            }
        })
    }
}

module.exports = DiscountService