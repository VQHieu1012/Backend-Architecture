'use strict'

const JWT = require('jsonwebtoken')
const { asyncHandler } = require('../helpers/asyncHandler')
const { AuthFailureError, NotFoundError } = require('../core/error.response')
const { findByUserId } = require('../services/keyToken.service')
const { keys } = require('lodash')


const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESHTOKEN: 'x-rtoken-id'
}

const createTokenPair = async ( payload, publicKey, privateKey ) => {
    try {
        // accessToken
        const accessToken = await JWT.sign( payload, publicKey, {
            expiresIn: '2 days'
        })

        const refreshToken = await JWT.sign( payload, privateKey, {
            expiresIn: '7 days'
        })

        // 

        JWT.verify( accessToken, publicKey, (err, decode) => {
            if (err){
                console.error(`Error verify::`, err)
            } else {
                console.log(`decode verify::`, decode)
            }
        })

        return { accessToken, refreshToken }
    } catch (error) {
        return {
            code: 'xxxx authUtils',
            message: error.message
        }
    }
}

const authentication = asyncHandler( async (req, res, next) => {
    /*
    1. check userId missing ?
    2. get accessToken
    3. verify token
    4. check user in dbs
    5. check keyStore with userId?
    6. OK all => return next()
    */

    const userId = req.headers[HEADER.CLIENT_ID]
    if (!userId)  throw new AuthFailureError('Invalid Request')

    // 2
    const keyStore = await findByUserId( userId )
    if (!keyStore)  throw new NotFoundError('Not found keyStore')
    
    // 3 verify token
    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if (!accessToken)  throw new AuthFailureError('Invalid Request')
    
    try {
        const decodeUser = JWT.verify( accessToken, keyStore.publicKey)
        if ( userId !== decodeUser.userId ){
            throw new AuthFailureError('Invalid UserID')
        }
        req.keyStore = keyStore
        return next()
    } catch (error) {
        throw error
    }
})

const authenticationV2 = asyncHandler( async (req, res, next) => {
    /*
    1. check userId missing ?
    2. get accessToken
    3. verify token
    4. check user in dbs
    5. check keyStore with userId?
    6. OK all => return next()
    */

    const userId = req.headers[HEADER.CLIENT_ID]
    if (!userId)  throw new AuthFailureError('Invalid Request')

    // 2
    const keyStore = await findByUserId( userId )
    if (!keyStore)  throw new NotFoundError('Not found keyStore')

    // 3 verify token
    if (req.headers[HEADER.REFRESHTOKEN]){
        try {
            const refreshToken = req.headers[HEADER.REFRESHTOKEN]
            const decodeUser = JWT.verify( refreshToken, keyStore.privateKey)
            if ( userId !== decodeUser.userId ) throw new AuthFailureError('Invalid UserID')
            
            req.keyStore = keyStore
            req.user = decodeUser
            req.refreshToken = refreshToken

            console.log('Authen done!!!')

            return next()
        } catch (error) {
            throw error
        }
    } 

    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if (!accessToken)  throw new AuthFailureError('Invalid Request')
    
    try {
        const decodeUser = JWT.verify( accessToken, keyStore.publicKey)
        if ( userId !== decodeUser.userId ){
            throw new AuthFailureError('Invalid UserID')
        }
        req.keyStore = keyStore
        return next()
    } catch (error) {
        console.log('err')
        throw error
    }
})

const verifyJWT = async (token, keySecret) => {
    return await JWT.verify(token, keySecret)
}

module.exports = {
    createTokenPair,
    authentication,
    authenticationV2,
    verifyJWT
}
