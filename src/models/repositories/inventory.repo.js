'use strict'
const {inventory} = require('../inventory.model');
const { Types } = require('mongoose');

const insertInventory = async({
    productId, shopId, stock, location = "unkown"
}) => {
    return await inventory.create({
        inven_shopId: shopId,
        inven_stock: stock,
        inven_location: location,
        inven_productId: productId
    })
}

module.exports = { insertInventory }