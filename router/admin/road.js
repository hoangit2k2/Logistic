import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import Road from "../../model/Road.js"
import Warehouse from "../../model/Warehouse.js"
import { createRoadValidate } from "../../validation/road.js"

const roadAdminRoute = express.Router()


/**
 * @route GET /api/admin/road
 * @description get about information
 * @access private
 */
roadAdminRoute.get("/", async (req, res) => {
    try {
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
        const page = req.query.page ? parseInt(req.query.page) : 0;
        const { keyword, sortBy, origin, destination, distance } = req.query;
        console.log(keyword, sortBy, origin, destination, distance)
        var query = {};
        var keywordList = keyword
            ? {
                $or: [
                    { origin: { $regex: keyword, $options: "i" } },
                    { destination: { $regex: keyword, $options: "i" } },
                    { distance: { $regex: keyword, $options: "i" } },
                ],
            }
            : {};

        if (origin) {
            query.origin = origin;
        }
        if (destination) {
            query.destination = destination;
        }
        if (distance) {
            query.distance = distance;
        }
        
        const length = await Road.find({ $and: [query, keywordList] }).count()
        const road = await Road.find({ $and: [query, keywordList] })
            .skip(pageSize * page)
            .limit(pageSize)
            .sort(`${sortBy}`);
        if (road.length == 0) {
                return sendError(res,  "Road information is not found.")
            }
        if (road)
            return sendSuccess(res, "Get road information successfully.", {length, road});
        return sendError(res, "Road information is not found.");
    } catch (error) {
        console.log(error);
        return sendServerError(res);
    }
});


/**
 * @route GET /api/admin/road/:id
 * @description get about information by id
 * @access private
 */
roadAdminRoute.get('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const roads = await Road.findById(id)
            if (roads) return sendSuccess(res, "Get road information successfully.", roads)
            return sendError(res, "Road information is not found.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
 * @route POST /api/admin/create/road
 * @description create information of road
 * @access private
 */
roadAdminRoute.post('/create', async (req, res) => {
    const errors = createRoadValidate(req.body)
    if (errors)
        return sendError(res, errors)
    try {
        const { distance, origin, destination } = req.body

        const isExistOrigin = await Warehouse.exists({ _id: origin })
        const isExistDestination = await Warehouse.exists({ _id: destination })

        if (!isExistOrigin)
            return sendError(res, 'Origin does not exist.')
        if (!isExistDestination)
            return sendError(res, 'Destination does not exist.')

        await Road.create({ distance, origin, destination })
        return sendSuccess(res, 'Set road information successfully.')
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route PUT /api/admin/road/:id
 * @description update information of road
 * @access private
 */
roadAdminRoute.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { distance, origin, destination } = req.body

        const errors = createRoadValidate(req.body)
        if (errors)
            return sendError(res, errors)
        
        const isExistOrigin = await Warehouse.exists({_id: origin })        
        if (!isExistOrigin)
            return sendError(res, 'Origin does not exist.')

        const isExistDestination = await Warehouse.exists({_id: destination })
        if (!isExistDestination)
            return sendError(res, 'Destination does not exist.')

        const isExistId = await Road.exists({ _id: id })
        if (!isExistId)
            return sendError(res, "This road is not existed.")
        
        const isExist = await Road.exists({ distance: distance, origin: origin, destination: destination })
        if (isExist)
            return sendError(res, "This road is already existed.")

        await Road.findByIdAndUpdate(id, { origin: origin, destination: destination, distance: distance })
        return sendSuccess(res, "Update road successfully.", { origin, destination, distance })

    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})


/**
 * @route DELETE /api/admin/road/:id
 * @description delete a road existing 
 * @access private
 */
roadAdminRoute.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const isExit = await Road.exists({ _id: id })
        if (!isExit)
            return sendError(res, "Road does not exist")

        const data = await Road.findByIdAndRemove(id)
        return sendSuccess(res, "Delete road successfully.", data)
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

export default roadAdminRoute