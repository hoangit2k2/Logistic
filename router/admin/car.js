import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import Car from "../../model/Car.js"
import CarFleet from "../../model/CarFleet.js"
import { createCarValidate } from "../../validation/car.js"

const carAdminRoute = express.Router()


/**
 * @route GET /api/admin/car
 * @description get car information
 * @access private
 */
carAdminRoute.get('/',
    async (req, res) => {
        try {
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
            const page = req.query.page ? parseInt(req.query.page) : 0
            const { car_type, plate, sortBy, keyword } = req.query
            var query = {}
            var listKeyword = keyword ? {
                $or: [
                    { plate: { $regex: keyword, $options: 'i' } },
                    { car_type: { $regex: keyword, $options: 'i' } },
                ]
            } : {};

            if (car_type) {
                query.car_type = car_type;
            }
            if (plate) {
                query.plate = plate;
            }

            const length = await Car.find({ $and: [query, listKeyword] }).count()
            const listCar = await Car.find({ $and: [query, listKeyword] })
                .limit(pageSize)
                .skip(pageSize * page)
                .sort(`${sortBy}`)

            if (listCar) return sendSuccess(res, "Get car successfully.", { length, listCar })
            return sendError(res, "Information not found.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
* @route GET /api/admin/car/:id
* @description get about information by id
* @access private
*/
carAdminRoute.get('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const cars = await Car.findById(id)
            if (cars) return sendSuccess(res, "Get car successfully.", cars)
            return sendError(res, "Information not found.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })
/**
 * @route POST /api/admin/car
 * @description create about information of car
 * @access private
 */
carAdminRoute.post('/create', async (req, res) => {
    const errors = createCarValidate(req.body)
    if (errors)
        return sendError(res, errors)

    try {
        const { plate, car_type, volumn, tonnage, car_fleet, seri, expired } = req.body
        const isExist = await Car.exists({ plate })
        const isExistCarfleet = await CarFleet.exists({ _id: car_fleet })
        if (isExist)
            return sendError(res, "This car plate is already existed.")
        if (!isExistCarfleet)
            return sendError(res, "This car fleet is not existed.")
        else await Car.create({ plate, car_type, volumn, tonnage, car_fleet, 'insurance.seri': seri, 'insurance.expired': expired })

        return sendSuccess(res, 'set car information successfully.')
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route PUT /api/admin/car/:id
 * @description update infomation of a existing car
 * @access private
 */
carAdminRoute.put('/:id', async (req, res) => {
    try {
        const { plate, car_type, volumn, tonnage, car_fleet, seri, expired } = req.body
        const { id } = req.params;

        const isExist = await Car.exists({ _id: id })
        if (!isExist)
            return sendError(res, "ID does not exists.")
            
        const isExistCarfleet = await CarFleet.exists({ _id: car_fleet })
        if (!isExistCarfleet)
            return sendError(res, "This car fleet is not existed.")
        await Car.findByIdAndUpdate(id, { plate, car_type, volumn, tonnage, car_fleet, 'insurance.seri': seri, 'insurance.expired': expired })
        return sendSuccess(res, "Update car successfully.", { volumn, tonnage, car_type, tonnage, car_fleet })
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route DELETE /api/admin/car/:id
 * @description delete a car existing 
 * @access private
 */
carAdminRoute.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const isExit = await Car.exists({ _id: id })
        if (!isExit)
            return sendError(res, "Car does not exist.")

        const data = await Car.findByIdAndRemove(id)
        return sendSuccess(res, "Delete car successfully.", data)
           
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

export default carAdminRoute