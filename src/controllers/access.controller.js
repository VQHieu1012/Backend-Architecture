'use strict'

const AccessService = require("../services/access.service");
const {OK, CREATED, SuccessResponse} = require('../core/success.response');

class AccessController {

    login = async (req, res, next) => {
        new SuccessResponse({
            metadata: await AccessService.login( req.body )
        }).send(res)
    }

    signUp = async ( req, res, next) => {
        console.log("Come to AccessController Signup")
        new CREATED({
            message: 'Registered OK!',
            metadata: await AccessService.signUp(req.body)
        }).send(res)
    }

    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout success!',
            metadata: await AccessService.logout( {keyStore: req.keyStore})
        }).send(res)
    }
}

module.exports = new AccessController()
