'use strict'

const shopModel = require("../models/shop.model");
const bcrypt = require('bcrypt');
const crypto = require('crypto')
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require('../utils');
const { BadRequestError, AuthFailureError, ForbiddenError } = require("../core/error.response");
const { findByEmail } = require("./shop.service");
const keytokenModel = require("../models/keytoken.model");

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    // check if this token is used
    static handlerRefreshTokenV2 = async ( {keyStore, user, refreshToken}) => {

        const { userId, email } = user;
        console.log(typeof(keyStore.refreshTokensUsed))
        if (keyStore.refreshTokensUsed.includes(refreshToken)){
            await KeyTokenService.deleteKeyById(userId)
            throw new ForbiddenError('Something wrong happened! Pls re-login!')
        }
        console.log('check1')
        if (keyStore.refreshToken !== refreshToken) throw new AuthFailureError('Shop is not regristered!')

        const foundShop = await findByEmail({email})
        if (!foundShop) throw new AuthFailureError('Shop is not regristered!')

        // create 1 cap moi
        const tokens = await createTokenPair({userId, email}, keyStore.publicKey, keyStore.privateKey)
        // update tokens
        await keyStore.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken // da duoc su dung de lay token moi
            }
        })

        return {
            user,
            tokens
        }
    }

    // check if this token is used
    static handlerRefreshToken = async ( refreshToken) => {
        const foundToken = await KeyTokenService.findByRefreshTokenUsed( refreshToken )
        
        // kiem tra xem token nay da duoc su dung hay chua, neu co xoa Key cua user nay
        // decode to get user
        if (foundToken) {
            const {userId, email} = await verifyJWT( refreshToken, foundToken.privateKey)
            console.log( {userId, email} )

            await KeyTokenService.deleteKeyById(userId)
            throw new ForbiddenError('Something wrong happened! Pls re-login!')
        } 

        // nếu chưa, viết hàm để check xem refresh token có đúng là đang được sử dụng hay không
        const holderToken = await KeyTokenService.findByRefreshToken( refreshToken )
        if (!holderToken) throw new AuthFailureError('Shop is not regristered!')

        // verify token
        const {userId, email} = await verifyJWT(refreshToken, holderToken.privateKey)
        console.log('[2]---', {userId, email})
        // check userId
        const foundShop = await findByEmail({email})
        console.log(foundShop)
        if (!foundShop) throw new AuthFailureError('Shop is not regristered!')

        // create 1 cap moi
        const tokens = await createTokenPair({userId, email}, holderToken.publicKey, holderToken.privateKey)

        // update tokens
        await holderToken.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken // da duoc su dung de lay token moi
            }
        })
        

        return {
            user: {userId, email},
            tokens
        }
    }

    static logout = async ( {keyStore} ) => {
        const delKey = await KeyTokenService.removeKeyById( keyStore._id )
        console.log({ delKey })
        return delKey
    }

    /* 
    1 - check email in dbs
    2 - match password
    3 - create Access Token and Refresh Token
    4 - generate token
    5 - get data return login
    */

    static login = async ({ email, password, refreshToken = null}) => {

        // check email
        const foundShop = await findByEmail({ email })
        if (!foundShop){
            throw new BadRequestError('Shop not registered!')
        }

        // match password
        const match = bcrypt.compare(password, foundShop.password)
        if (!match){
            throw new AuthFailureError('Authentication Error!')
        }

        // create Access Token and Refresh Token
        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')

        // generate token
        const {_id: userId} = foundShop
        const tokens = await createTokenPair({userId, email}, publicKey, privateKey)
        
        
        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken, privateKey, publicKey,
            userId
        })

        return {
            shop: getInfoData({fields: ['_id', 'name', 'email'], object: foundShop}),
            tokens
        }

    }


    static signUp = async ({ name, email, password }) => {
        //try {
            
            // step 1: check if email exists or not ??
            const holderShop = await shopModel.findOne({ email }).lean()
            if(holderShop) {
                throw new BadRequestError('Error: Shop already existed!!!')
            }
            
            const passwordHash = await bcrypt.hash(password, 10)
            console.log('Hashes password!!!')

            const newShop = await shopModel.create({
                name, email, password: passwordHash, roles: [RoleShop.SHOP]
            })

            if (newShop){
                // create privateKey, publicKey
                // const {privateKey, publicKey} = crypto.generateKeyPairSync('rsa', {
                //     modulusLength: 4096,
                //     publicKeyEncoding:{
                //         type: 'pkcs1',
                //         format: 'pem'
                //     },
                //     privateKeyEncoding: {
                //         type: 'pkcs1',
                //         format: 'pem'
                //     }
                // })

                const privateKey = crypto.randomBytes(64).toString('hex')
                const publicKey = crypto.randomBytes(64).toString('hex')

                console.log({privateKey, publicKey}) // save collection KeyStore

                const keyStore = await KeyTokenService.createKeyToken({
                    userId: newShop._id,
                    publicKey,
                    privateKey
                })

                if (!keyStore){
                    return {
                        code: 'xxxx',
                        message: 'keyStore error'
                    }
                }

                // create token pair
                const tokens = await createTokenPair({userId: newShop._id, email}, publicKey, privateKey)
                console.log(`Created Token Success::`, tokens)
                
                return {
                    code: 201,
                    metadata: {
                        shop: getInfoData({fields: ['_id', 'name', 'email'], object: newShop}),
                        tokens
                    }
                }
            }

        // } catch (error) {
        //     return {
        //         code: 'xxx',
        //         message: error.message,
        //         status: 'error'
        //     }
        // }
    }
}

module.exports = AccessService