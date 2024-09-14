'use strict'

const AccessService = require("../services/access.service")

class AccessController {

    signUp = async ( req, res, next) => {
        console.log("Come to AccessController Signup")
        return res.status(201).json(await AccessService.signUp(req.body))
    }
}

module.exports = new AccessController()
