import jwt from "jsonwebtoken"
import { mkdir } from "fs"
import { sendError, sendServerError } from "../helper/client.js"
import { TOKEN_BLACKLIST, TOKEN_LIST } from "../index.js"

/**
 * 
 */
export const createUploadDir = (req, res, next) => {
    const d = new Date()
    const dirName = d.toISOString().slice(0,7)
    mkdir(`public/uploads/${dirName}`, { recursive: true }, (err) => {
        if(err) return sendError(res, 'Cannot upload file.')
    })
    req.dirName = dirName
    next()
}

export const createAssetsDir = (req, res, next) => {
    mkdir(`public/assets`, { recursive: true }, (err) => {
        if(err) return sendError(res, 'Cannot upload file.')
    })
    req.dirName = 'assets'
    next()
}

export const createLogoDir = (req, res, next) => {
    mkdir(`public/logo`, { recursive: true }, (err) => {
        if(err) return sendError(res, 'Cannot upload file.')
    })
    req.dirName = 'logo'
    next()
}

export const createImageDir = (req, res, next) => {
    mkdir(`public/images`, { recursive: true }, (err) => {
        if(err) return sendError(res, 'Cannot upload file.')
    })
    req.dirName = 'images'
    next()
}

/**
 * header contain
 * Authorised : Bearer token
 */
export const verifyToken = async (req, res, next) => {
    try {
        const data = req.headers['authorization']
        const token = data?.split(" ")[1];
        if(!token) return sendError(res, 'jwt must be provided.', 401)

        if(token in TOKEN_LIST || token in TOKEN_BLACKLIST)
            return sendError(res, "Unauthorized.", 401)
        
        const { payload } = jwt.verify(token, process.env.JWT_SECRET_KEY, {
            complete: true
        })
        
        if(!payload.user) return sendError(res, "Unauthorized.", 401)

        req.verifyToken = token
        req.user = payload.user
        next()

    } catch (error) {
        return sendError(res, 'jwt expired.', 401)
    }
}

export const verifyAdmin = async (req, res, next) => {
    if (req.user.role.staff_type !== 'admin')
        return sendError(res, 'Forbidden.',403)
    next()    
}

export const verifyStaff = async (req, res, next) => {
    if (! req.user.role.hasOwnProperty('staff_type'))
        return sendError(res, 'Forbidden.',403)
    next()    
}

export const verifyCustomer = async (req, res, next) => {
    if (! req.user.role.hasOwnProperty('customer_type'))
        return sendError(res, 'Forbidden.',403)
    next()    
}
export const verifyStorekeeper = async (req, res, next) => {
    if (req.user.role.staff_type !== 'storekeeper')
        return sendError(res, 'Forbidden.',403)
    next()    
}
export const verifyCustomerOrAdmin = async (req, res, next) => {
    if (req.user.role.staff_type !== 'admin' && (!req.user.role.hasOwnProperty('customer_type'))) 
        return sendError(res, 'Forbidden.', 403)
    next()
}
export const verifyDriver = async (req, res, next) => {
    if (req.user.role.staff_type !== 'driver')
        return sendError(res, 'Forbidden.',403)
    next()
}