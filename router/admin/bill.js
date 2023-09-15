import express from "express"
import { sendError, sendServerError, sendSuccess } from "../../helper/client.js"
import Bill from "../../model/Bill.js"
import DeliveryService from "../../model/DeliveryService.js"
import Road from "../../model/Road.js"
import Car from "../../model/Car.js"
import CarFleet from "../../model/CarFleet.js"
import Staff from "../../model/Staff.js"
import ProductShipment from "../../model/ProductShipment.js"
import { createBillValidate } from "../../validation/bill.js"
import Distance from "../../model/Distance.js"
import Warehouse from "../../model/Warehouse.js"
import Order from "../../model/Order.js"
import { updateStatusBill } from "../../service/bill.js"

const billAdminRoute = express.Router()

/**
 * @route GET /api/admin/bill
 * @description get about information
 * @access private
 */
billAdminRoute.get("/", async (req, res) => {
    try {
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
        const page = req.query.page ? parseInt(req.query.page) : 0;
        const { keyword, sortBy, limit, service, road, car, driver, product_shipments, status } = req.query;
        console.log(keyword, sortBy, limit, service, road, car, driver, product_shipments, status)

        var query = {};
        var keywordList = keyword
            ? {
                $or: [
                    { service: { $regex: keyword, $options: "i" } },
                    { road: { $regex: keyword, $options: "i" } },
                    { car: { $regex: keyword, $options: "i" } },
                    { driver: { $regex: keyword, $options: "i" } },
                    { product_shipments: { $regex: keyword, $options: "i" } },
                    { status: { $regex: keyword, $options: "i" } },
                ],
            }
            : {};

        if (service) {
            query.service = service;
        }
        if (road) {
            query.road = road;
        }
        if (car) {
            query.car = car;
        }
        if (driver) {
            query.driver = driver;
        }
        if (product_shipments) {
            query.product_shipments = product_shipments;
        }
        if (status) {
            query.status = status;
        }

        const length = await Bill.find({ $and: [query, keywordList] }).count()
        const bills = await Bill.find({ $and: [query, keywordList] })
            .skip(pageSize * page)
            .limit(pageSize)
            .sort(`${sortBy}`);

        if (bills)
            return sendSuccess(res, "Get bill information successfully.", { length, bills });
        return sendError(res, "Bill information is not found.");
    } catch (error) {
        console.log(error);
        return sendServerError(res);
    }
});

/**
 * @route GET /api/admin/bill/:id
 * @description get about information of bill by id
 * @access private
 */
billAdminRoute.get('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const bills = await Bill.findById(id)
            if (bills) return sendSuccess(res, "Get bill successful.", bills)
            return sendError(res, "Not information found.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
 * @route POST /api/admin/bill/create
 * @description create information of bill
 * @access private
 */
billAdminRoute.post('/create', async (req, res) => {
    const errors = createBillValidate(req.body)
    if (errors) return sendError(res, errors)
    try {
        const { service, road, car, driver, status, actual_fuel, theoretical_fuel } = req.body

        const services = await DeliveryService.findById({ _id: service })
        if (!services) return sendError(res, 'Service does not exist.')

        const roads = await Road.findById({ _id: road })
        if (!roads) return sendError(res, 'Road does not exist.')

        const cars = await Car.findById({ _id: car })
        if (!cars) return sendError(res, 'Car does not exist.')

        const drivers = await Staff.findById({ _id: driver })
        if (!drivers) return sendError(res, 'Driver does not exist.')

        const carFleetId = cars.car_fleet
        const car_fleets = await CarFleet.findById({ _id: carFleetId })
        if (!car_fleets) return sendError(res, 'Carfleet does not exist.')     

        let orderId = await Order.find()
        let serviceIds = []
        for (let i = 0; i < orderId.length; i++) {
            serviceIds.push(orderId[i].service)
        }

        let serviceString = serviceIds.toString()
        if (serviceString.includes(service)) {
            let distance = services.distances
            let findDistance = await Distance.findById(distance)
            let distanceFromProvince = findDistance.fromProvince
            let distanceToProvince = findDistance.toProvince

            let roadOrigin = roads.origin
            let roadDestination = roads.destination
            let warehouseOrigin = await Warehouse.findById(roadOrigin)
            let warehouseDestination = await Warehouse.findById(roadDestination)
            let warehouseProvinceOrigin = warehouseOrigin.province
            let warehouseProvinceDestination = warehouseDestination.province

            if (distanceFromProvince == warehouseProvinceOrigin && distanceToProvince == warehouseProvinceDestination || distanceFromProvince == warehouseProvinceDestination && distanceToProvince == warehouseProvinceOrigin) {
                const bill = await Bill.create({ service, road, car, driver, status, actual_fuel, theoretical_fuel })
                const updateCarFleet = await CarFleet.findOneAndUpdate(
                    { _id: carFleetId },
                    { $push: { bills: bill } }
                );
                if (!updateCarFleet) return sendServerError(res, "Update bill in carfleet failed.")
                return sendSuccess(res, 'Create bill information successfully.', bill)
            }
            return sendError(res, 'Create bill information failed.')
        } else {
            return sendError(res, 'Order has not been created.')
        }
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
});

/**
 * @route POST /api/admin/bill/
 * @description create information of bill
 * @access private
 */
billAdminRoute.post("/product_shipments/:billId", async (req, res) => {
    const { shipment, turnover } = req.body;

    try {
        const isExist = await Bill.exists({
            _id: req.params.billId,
        })

        if (!isExist) {
            return sendError(res, 'Bill is not existed')
        }
        const shipmentExist = await ProductShipment.exists({
            _id: shipment
        })
        if (!shipmentExist) {
            return sendError(res, 'The shipment is not existed.')
        }

        await Bill.updateOne(
            {
                _id: req.params.billId,
            },
            {
                $push: { product_shipments: { shipment, turnover } },
            }
        );
        return sendSuccess(res, "Add product shipment successfully.");

    } catch (error) {
        return sendServerError(res);

    }
})

/**
 * @route DELETE /api/admin/bill/:id
 * @description delete a bill existing 
 * @access private
 */
billAdminRoute.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) return sendError(res, "Bill does not exist.")
        const isExit = await Bill.exists({ _id: id })
        if (!isExit) return sendError(res, "Bill does not exist.")
        const data = await Bill.findByIdAndRemove(id)
        await CarFleet.updateMany({}, { $pull: { bills: id } });
        return sendSuccess(res, "Delete bill successfully.", data)
    }
    catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})

/**
 * @route PUT /api/admin/bill/:id
 * @description update information of product shipment
 * @access private
 */
billAdminRoute.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { service, road, car, driver, status, actual_fuel, theoretical_fuel } = req.body

        const errors = createBillValidate(req.body)
        if (errors)
            return sendError(res, errors)

        const isExist = await Bill.exists({
            service: service, road: road, car: car,
            driver: driver, status: status, actual_fuel: actual_fuel, theoretical_fuel: theoretical_fuel
        })
        if (isExist)
            return sendError(res, "This bill is existed.")

        await Bill.findByIdAndUpdate(id, {
            service: service, road: road, car: car,
            driver: driver, status: status, actual_fuel: actual_fuel, theoretical_fuel: theoretical_fuel
        })
        return sendSuccess(res, "Update bill successfully.", { service, road, car, driver, status, actual_fuel, theoretical_fuel })

    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
})
/**
 * @router Put /api/admin/bill/status/:id
 * @description update infomation of status bill
 * @access private
 */
 billAdminRoute.put('/status/:id', async(req, res) => {
    try {
    const { id } = req.params
    const isExit = await Bill.exists({ _id: id })
    if (!isExit){
    return sendError(res, "Bill does not exist.")
    }
    updateStatusBill(id)
    return sendSuccess(res, "Update status to completed")
    } catch (error) {
        console.log(error)
        return sendServerError(res)
    }
  
})
export default billAdminRoute