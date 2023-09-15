import express from 'express'
import argon2 from "argon2"
import { sendError, sendServerError, sendSuccess } from '../../helper/client.js'
import Staff from '../../model/Staff.js'
import User from '../../model/User.js'
import { staffRegisterValidate } from '../../validation/auth.js'
import Department from '../../model/Department.js'
const authAdminRoute = express.Router()

/**
 * @route POST /api/admin/auth/register
 * @description register staff account
 * @access private
 */
authAdminRoute.post('/register',
    async (req, res) => {
        const errors = staffRegisterValidate(req.body)
        if (errors)
            return sendError(res, errors)

        let { name, email, password, phone, staff_type, department } = req.body

        try {
            const isExist = await User.exists({ email }) || await User.exists({ phone })
            if (isExist)
                return sendError(res, 'user already exists.')
            const departmentExist = await Department.findById(department)
            if(!departmentExist) return sendError(res, 'department already exits.')
            const newStaff = await Staff.create({
                name,
                staff_type,
                department
            })

            password = await argon2.hash(password)
            await User.create({
                name, email, password, phone, role: newStaff._id, isActive: true
            })
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
        return sendSuccess(res, 'user registered successfully.')
    }
)

export default authAdminRoute