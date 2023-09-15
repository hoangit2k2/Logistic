import express from "express";
import { sendError, sendServerError, sendSuccess } from '../../helper/client.js'
import CarRepair from "../../model/CarRepair.js"
import Car from "../../model/Car.js"
import  { createCarRepairValidate }  from "../../validation/carrepair.js"
const carRepairAdminRoute = express.Router()
/**
 * @route get /api/admin/carrepair/
 * @description get infomation carrepair
 * @access private
 */
carRepairAdminRoute.get('/', async (req,res) => {

    try {
        const pagesize = req.query.pagesize ? parseInt(req.query.pagesize) : 0
        const page = req.query.page ? parseInt(req.query.page) : 0
        const { repairCar_type, device, sortBy, keyword } = req.query
        var query = {}
        var listKeyword =  keyword ? {
            $or: [
                { repairCar_type: { $regex: keyword, $options: 'i'}},
                { device: { $regex: keyword, $options: 'i'}},
            ]
        }: {};
        if(repairCar_type) {
            query.repairCar_type = repairCar_type;
        }
        if(device) {
            query.device = device;
        }
        const length = await CarRepair.find({ $and: [query, listKeyword]}).count()
        const listCarRepair = await CarRepair.find({ $and: [query, listKeyword]})
            .limit(pagesize)
            .skip(pagesize * page)
            .sort(`${sortBy}`)
        if(listCarRepair) return sendSuccess(res, "Get Carrepair successful",{length, listCarRepair})
        return sendError(res, "Information not found.")
    } catch (error) {
        return sendServerError(res)
    }
})


/**
 * @route get /api/admin/carrepair/:id
 * @description get infomation carrepair by id
 * @access private
 */

carRepairAdminRoute.get('/:id',
    async (req, res) => {
        try {
            const {id} = req.params
            const carrepairs = await CarRepair.findById(id)
            if(carrepairs) return sendSuccess(res, "Get carrepair successful", carrepairs)
            return sendError(res, "Not information found.")
        } catch (error) {
            return sendServerError(res)
        }
    }
    )
/**
 * @route post /api/admin/carrepair/create
 * @description post carrepair
 * @access private
 */
 carRepairAdminRoute.post('/create', async (req, res) => {
    const errors = createCarRepairValidate(req.body)
    if(errors)
        return sendError(res, errors)

    try {
        const {car, repairCar_type, device, price, note} = req.body
        const isExitCar = await Car.exists({ _id: car})
        if(!isExitCar)
            return sendError(res, "This Car is not existed")
        else await CarRepair.create({ car, repairCar_type, device, price, note})
        return sendSuccess(res, 'set carrepair information successfully.')
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
/**
 * @route delete /api/admin/carrepair/:id
 * @description delet carrepair by id
 * @access private
 */
carRepairAdminRoute.delete('/:id', async(req, res) => {
    const { id } = req.params;
    try {
        const isExit = await CarRepair.exists({ _id: id})
        if(!isExit)
            return sendError(res, "Car not exitsts")
        const data = await CarRepair.findByIdAndRemove(id)
        return sendSuccess(res, "Delete Carrepair successfully", data)
        }
    catch(error){
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route put /api/admin/carrepair/:id
 * @description delet carrepair by id
 * @access private
 */
carRepairAdminRoute.put('/:id', async(req, res) => {
    try {
        const {car, repairCar_type, device, price,note} = req.body
        const { id } = req.params;
        const isExist = await CarRepair.exists({ _id: id})
        if(!isExist)
            return sendError(res, "ID does not exits")
        const isExistCar = await Car.exists({ _id: car})
        if(!isExistCar)
            return sendError(res, "This car is not exited")
        await CarRepair.findByIdAndUpdate(id, {car, repairCar_type, device, price,note} )
        return sendSuccess(res,"Update Succesfully",{car, repairCar_type, device, price,note})
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
/**
 * @route get /api/admin/carrepair/:plate
 * @description get history repair by name car
 * @access private
 */
 carRepairAdminRoute.get('/car/:plate',
 async (req, res) => {
     const { plate } = req.params
     try {
         const car = await Car.findOne({ plate: plate})
         const carrepairs = await CarRepair.find({ car: car._id})
         if(carrepairs) return sendSuccess(res, "Get history repair successful", carrepairs)
         return sendError(res, "Not information found.")
     } catch (error) {
         console.log(error)
         return sendServerError(res)
     }
 }
 )
export default carRepairAdminRoute;