'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.response");
const discount = require("../models/discount.model");
const { findAllDiscountCodesUnSelect, findAllDiscountCodesSelect } = require("../models/repositories/discount.repo");
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
}

module.exports = {DiscountService}