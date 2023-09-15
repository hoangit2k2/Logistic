import express, { request } from "express"
import Warehouse from "../../model/Warehouse.js"
import Bill from "../../model/Bill.js"
import { sendError, sendRequest, sendServerError, sendSuccess } from "../../helper/client.js"
import ProductShipment from "../../model/ProductShipment.js"
import { createWarehouseValidate } from "../../validation/warehouse.js"
import opencage from "opencage-api-client"
import { SHIPMENT_MANAGER, OPENCAGE_API_KEY, STAFF } from "../../constant.js"
import { calculateWarehouseTurnover } from "../../service/turnoverWarehouse.js"
import Staff from "../../model/Staff.js"
const warehouseAdminRoute = express.Router()

/**
 * @route POST /api/admin/warehouse/
 * @description create new warehouse
 * @access private
 */
warehouseAdminRoute.post('/',
    async (req, res) => {
        const errors = createWarehouseValidate(req.body)
        if (errors)
            return sendError(res, errors)

        const { name, phone, street, ward, district, province, storekeeper, inventory_product_shipments } = req.body
        try {
            const isExist = await Warehouse.exists({ name })
            if (isExist) return sendError(res, 'the warehouse\'s name is existed.')
            const isExistStorekeeper = await Staff.exists({ _id: storekeeper, staff_type: STAFF.STOREKEEPER })
            if (!isExistStorekeeper) return sendError(res, 'the storekeeper is not existed')
            var lat = 0, lon = 0
            const data = await opencage.geocode({ q: `${street},${ward},${district},${province}`, key: OPENCAGE_API_KEY })
            if (data) {
                if (data.status.code == 200 && data.results.length > 0) {
                    lat = data.results[0].geometry.lat
                    lon = data.results[0].geometry.lng
                }
            }
            if (lon || lat) {
                await Warehouse.create({
                    name, phone, street, ward, district, province, storekeeper, lon, lat, inventory_product_shipments
                })
                return sendSuccess(res, 'Create new warehouse successfully.',
                {
                    name, phone, street, ward, district, province, storekeeper, lon, lat, inventory_product_shipments
                })
            }
            return sendError(res, 'Supplied address does not exist.')
        }
        catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

/**
* @route PUT /api/admin/warehouse/:id
* @description update information of a warehouse
* @access private
*/
warehouseAdminRoute.put('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const { name, phone, street, ward, district, province, storekeeper } = req.body
            const warehouse = await Warehouse.findById(id)
            if (warehouse) {
                var lat = 0, lon = 0
                console.log(name && name !== warehouse.name)
                if (name && name !== warehouse.name) {
                    const isExistName = await Warehouse.exists({ name: name })
                    if (isExistName) return sendError(res, "New name is existed.")
                }

                if (street && ward && district && province) {
                    const data = await opencage.geocode({ q: `${street},${ward},${district},${province}`, key: OPENCAGE_API_KEY })
                    if (data) {
                        if (data.status.code == 200 && data.results.length > 0) {
                            lat = data.results[0].geometry.lat
                            lon = data.results[0].geometry.lng
                        }
                    }
                    if (lon || lat) {
                        await Warehouse.findByIdAndUpdate(id, { name, phone, street, ward, district, province, lon, lat, storekeeper })
                        return sendSuccess(res, "Update warehouse successfully", { name, phone, street, ward, district, province, lon, lat })
                    } else return sendError(res, "supplied address does not exist.")

                }
            }
            return sendError(res, "This warehouse name is not existed.")
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)

// /**
// * @route PUT /api/admin/:warehouseId/add-inventory
// * @description add productshipment to a warehouse
// * @access private
// */
// warehouseAdminRoute.put('/:warehouseId/add-inventory', async (req, res) => {
//     try {
//         let warehouseId = req.params.warehouseId
//         let {productShipmentId} = req.body
//         const productShipment = await ProductShipment.findById(productShipmentId)
//         const warehouse = await Warehouse.findById(warehouseId)
//         if (!productShipment || !warehouse) return sendError(res, "No information")
//         const bills = await Bill.find()
//         for (let i = 0; i < bills.length; i++) {
//             for (let j = 0; j < bills[i].product_shipments.length; j++) {
//                 if (bills[i].product_shipments[j].shipment == productShipmentId) {
//                     var turnover = bills[i].product_shipments[j].turnover;
//                     break;
//                 }
//             }
//         }
//         let add = {shipment: productShipment, turnover: turnover}
//         const totalTurnover = warehouse.turnover + Number(turnover)
//         let inventory_product_shipments = [...warehouse.inventory_product_shipments, add]
//         await Warehouse.findByIdAndUpdate(warehouseId, {inventory_product_shipments: inventory_product_shipments, turnover: totalTurnover})
//         return sendSuccess(res, "Add product shipment successfully")
//     }
//     catch (error) {
//         console.log(error);
//         return sendServerError(res)
//     }
// })
// /**
// * @route PUT /api/admin/:warehouseId/update-inventory
// * @description export or import productshipment to a warehouse
// * @access private
// */
// warehouseAdminRoute.put('/:warehouseId/update-inventory', async (req, res) => {
//     try {
//         const warehouseId = req.params.warehouseId
//         const {productShipmentId, status} = req.body
//         if (status != 'import' && status != 'export') return sendError(res, "Status must be 'import' or 'export'")
//         const warehouse = await Warehouse.findById(warehouseId)
//         const productShipment = await ProductShipment.findById(productShipmentId)
//         if (!productShipment || !warehouse) return sendError(res, "No information.")
//         for (let i = 0; i < warehouse.inventory_product_shipments.length; i++) {
//             if (warehouse.inventory_product_shipments[i].shipment == productShipmentId) {
//                 if (warehouse.inventory_product_shipments[i].status == status) {
//                     return sendError(res, "Status already set")
//                 }
//                 warehouse.inventory_product_shipments[i].status = status
//                 warehouse.turnover = warehouse.turnover + (status == 'import' ? +warehouse.inventory_product_shipments[i].turnover : -warehouse.inventory_product_shipments[i].turnover)
//                 await Warehouse.findByIdAndUpdate(warehouseId, {inventory_product_shipments: warehouse.inventory_product_shipments, turnover: warehouse.turnover})
//                 return sendSuccess(res, `${status} successfully`)
//             }
//         };
//         return sendError(res,"This product shipment can not be found in this warehouse.")    

//     }
//     catch (error) {
//         console.log(error);
//         return sendServerError(res)
//     }
// })

/**
* @route DELETE /api/admin/warehouse/:id
* @description delete a existing warehouse
* @access private
*/
warehouseAdminRoute.delete('/:id',
    async (req, res) => {
        const { id } = req.params;
        try {
            const isExist = await Warehouse.exists({ _id: id });
            if (!isExist) return sendError(res, "Warehouse does not exist");

            const data = await Warehouse.findByIdAndRemove(id)
            return sendSuccess(res, "Delete warehouse successfully.", data)
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)
export default warehouseAdminRoute