'use strict'

const AccessService = require("../services/access.service");
const {OK, CREATED, SuccessResponse} = require('../core/success.response');
const { keys } = require("lodash");

class AccessController {

    handlerRefreshToken = async (req, res, next) => {
        // console.log('checkpoint')
        // new SuccessResponse({
        //     message: 'Get token success !',
        //     metadata: await AccessService.handlerRefreshToken( req.body.refreshToken )
        // }).send(res)

        // v2 fixed
        new SuccessResponse({
            message: 'Get token success!',
            metadata: await AccessService.handlerRefreshTokenV2({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore
            })
        }).send(res)
    }

    login = async (req, res, next) => {
        new SuccessResponse({
            message: 'Login Success!',
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
