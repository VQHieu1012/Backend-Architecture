'use strict'



// const StatusCode = {
//      FORBIDDEN: 403,
//      CONFLICT: 409,
// }

// const ReasonStatusCode = {
//     FORBIDDEN: 'Bad request error',
//     CONFLICT: 'Conflict error'
// }

const {ReasonPhrases, StatusCode} = require('../utils/httpStatusCode')

class ErrorResponse extends Error {
    constructor(message, status){
        super(message)
        this.status = status
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.CONFLICT) {
        super(message, statusCode)
    }
}

class BadRequestError extends ErrorResponse {
    constructor( message = ReasonStatusCode.FORBIDDEN, statusCode = StatusCode.FORBIDDEN){
        super(message, statusCode)
    }
}

class AuthFailureError extends ErrorResponse {
    constructor( message = ReasonPhrases.UNAUTHORIZED, statusCode = StatusCode.UNAUTHORIZED){
        super(messgae, statusCode)
    }
}

module.exports = {
    ConflictRequestError,
    BadRequestError,
    AuthFailureError
}
