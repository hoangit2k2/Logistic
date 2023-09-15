import express from 'express'
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js";
import User from "../../model/User.js";
import { handleUser } from '../../service/user.js';

const userAdminRoute = express.Router()

/**
 * @route GET /api/user
 * @description get list user
 * @access private
 */
userAdminRoute.get('/',
    async (req, res) => {
        try {
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
            const page = req.query.page ? parseInt(req.query.page) : 0
            const { sortBy, keyword, email, phone } = req.query
            var query = {};
            var listKeyword = keyword ? {
                $or: [
                    { email: { $regex: keyword, $options: 'i' } },
                    { phone: { $regex: keyword, $options: 'i' } },
                ]
            } : {}
            if (email) {
                query.email = email;
            }
            if (phone) {
                query.phone = phone;
            }
            const length = await User.find({ $and: [query, listKeyword] }, { password: false }).count()
            const listUser = await User.find({ $and: [query, listKeyword] }, { password: false })
                .limit(pageSize)
                .skip(pageSize * page)
                .sort(`${sortBy}`)
            const users = await Promise.all(listUser.map(async user => handleUser(user)))
            return sendSuccess(res, "Get users successfully.", { length, users })
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
* @route GET /api/user/:id
* @description get user by id
* @access private
*/
userAdminRoute.get('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const user = await User.findById(id, { password: false })

            if (user) return sendSuccess(res, "Get user successfully.", await handleUser(user))
            return sendError(res, "No information found.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
 * @route PUT /api/admin/user/:id/status
 * @description update status user
 * @access private
 */
userAdminRoute.put('/:id/status', async (req, res) => {
    const { id } = req.params
    const { isActive } = req.query

    try {
        const user = await User.findByIdAndUpdate(id, { isActive })

        if (!user)
            return sendError(res, "User does not existed")
        return sendSuccess(res, "Update active account successfully")
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})


export default userAdminRoute