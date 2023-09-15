import jwt from "jsonwebtoken"

export const clearTokenList = (tokenlist) => {
    for (let key in tokenlist) {
        try {
            jwt.verify(tokenlist[key], process.env.JWT_SECRET_KEY, { complete: true })
        } catch (error) {
            delete tokenlist[key]
        }
    }
}