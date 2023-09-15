import express from 'express'
import { sendError, sendServerError, sendSuccess } from '../helper/client.js'
import { verifyCustomer, verifyStaff, verifyToken } from '../middleware/index.js'
import CarFleet from '../model/CarFleet.js'
import Customer from '../model/Customer.js'
import Department from '../model/Department.js'
import Staff from '../model/Staff.js'
import User from '../model/User.js'

const userRoute = express.Router()

/**
 * @route PUT /api/user/customer
 * @description update personnal customer information
 * @access private
 */
userRoute.put('/customer', verifyToken, verifyCustomer, async (req, res) => {
    const user = req.user
    const { name, email, phone, address, description, taxcode } = req.body

    try {
        const [isExistedEmail, isExistedPhone] = await Promise.all([
            User.exists({ email }),
            User.exists({ phone })
        ])
        if (isExistedEmail || isExistedPhone)
            return sendError(res, "Email/Phone is used.")
        await Promise.all([
            User.findByIdAndUpdate(user.id, { email, phone }),
            Customer.findByIdAndUpdate(user.role, { name, address, description, taxcode })
        ])
        return sendSuccess(res, "Update user's information successfully.")
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})


/**
 * @route PUT /api/user/staff
 * @description update personnal staff information
 * @access private
 */
userRoute.put('/staff', verifyToken, verifyStaff, async (req, res) => {
    const user = req.user
    const { name, email, phone, department, car_fleet } = req.body

    try {
        const [isExistedEmail, isExistedPhone, isExistedDepartment, isExistedCarFleet] = await Promise.all([
            User.exists({ email }),
            User.exists({ phone }),
            Department.exists({ _id: department }),
            CarFleet.exists({ _id: car_fleet })
        ])
        if (isExistedEmail || isExistedPhone)
            return sendError(res, "Email/Phone is used.")
        if (department && !isExistedDepartment)
            return sendError(res, "Department does not exist.")
        if (car_fleet && !isExistedCarFleet)
            return sendError(res, "Car Fleet does not exist.")

        await Promise.all([
            User.findByIdAndUpdate(user.id, { email, phone }),
            Staff.findByIdAndUpdate(user.role, { name, department, car_fleet })
        ])
        return sendSuccess(res, "Update user's information successfully.")
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

export default userRoute