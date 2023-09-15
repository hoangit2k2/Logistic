import express, { request } from "express"
import Warehouse from "../model/Warehouse.js"
import Bill from "../model/Bill.js"
import { sendError, sendServerError, sendSuccess } from "../helper/client.js"
import ProductShipment from "../model/ProductShipment.js"
import { verifyToken, verifyStorekeeper } from "../middleware/index.js"
import { STAFF, OPENCAGE_API_KEY } from "../constant.js"
import opencage from "opencage-api-client"
import { calculateWarehouseTurnover } from "../service/turnoverWarehouse.js"
const warehouseRoute = express.Router()

/**
 * @route GET /api/warehouse/
 * @description get all warehouse or limit
 * @access public
 */
warehouseRoute.get('/',
    async (req, res) => {
        try {
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0
            const page = req.query.page ? parseInt(req.query.page) : 0
            const { keyword ,province, district, sortBy, name, phone, street, ward } = req.query
            var query = {};
            var keywordCondition = keyword
            ? {
                $or: [
                    {name: {$regex: keyword, $options: "i"} },
                    {phone: {$regex: keyword, $options: "i"} },
                    {street: {$regex: keyword, $options: "i"} },
                    {ward: {$regex: keyword, $options: "i"} },
                    {province: {$regex: keyword, $options: "i"} },
                    {district: {$regex: keyword, $options: "i"} },
                ],
            }: {};
            if (name) {
                query.name = name;
            }
            if (phone) {
                query.phone = phone;
            }
            if (street) {
                query.street = street;
            }
            if (ward) {
                query.ward = ward;
            }
            if (province) {
                query.province = province;
            }
            if (district) {
                query.district = district;
            }
            const warehouses = await Warehouse.find({ $and: [query, keywordCondition] }).limit(pageSize).skip(pageSize * page).sort(`${sortBy}`)
            const length = await Warehouse.find({ $and: [query, keywordCondition] }).count();
            if (warehouses.length == 0) {
                return sendError(res, "No warehouse found")
            }
            if (warehouses) return sendSuccess(res, "Get warehouse successfully.", { length, warehouses })
            return sendError(res, "No warehouse found.")
        }
        catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    }
)
/**
 * @route GET /api/warehouse/:id
 * @description get warehouse by id
 * @access public
 */
warehouseRoute.get('/:id',
    async (req, res) => {
        try {
            const { id } = req.params
            const warehouse = await Warehouse.findById(id)
            if (!warehouse) { return sendError(res, "No information found.") }
            return sendSuccess(res, "get warehouse successful.", warehouse)
        } catch (error) {
            return sendServerError(res)
        }
    }
)

// /**
//  * @route PUT /api/warehouse/:id
//  * @description update a warehouse by a storekeeper
//  * @access private
//  */
// warehouseRoute.put('/:id', verifyToken, verifyStorekeeper,
//     async(req, res) => {
//             try{
//                 const {id} = req.params
//                 const {name, phone, street, ward, district, province} = req.body
//                 const warehouse = await Warehouse.findById(id)
//                 if (warehouse.storekeeper == req.user.role._id) {
//                     if (warehouse){
//                         var lat = 0, lon = 0
//                         console.log(name && name !== warehouse.name)
//                         if (name && name !== warehouse.name){
//                             const isExistName = await Warehouse.exists({name:name})
//                             if(isExistName) {return sendError(res, "New name is existed.")}               
//                         }

//                         if (street && ward && district && province){
//                             const data = await opencage.geocode({q: `${street},${ward},${district},${province}`, key: OPENCAGE_API_KEY})            
//                             if(data) {
//                                 if (data.status.code == 200 && data.results.length > 0) {
//                                     lat = data.results[0].geometry.lat
//                                     lon = data.results[0].geometry.lng 
//                                 }
//                             }
//                             if(lon || lat) {
//                                 await Warehouse.findByIdAndUpdate(id, {name, phone, street, ward, district, province, lon, lat})
//                                 return sendSuccess(res, "Update warehouse successfully",{name, phone, street, ward, district, province, lon, lat})
//                             } else return sendError(res, "supplied address does not exist.")

//                         }
//                     }
//                     else {return sendError(res, "This warehouse name is not existed.")}
//                 }

//                 }
//             catch (error) {
//                 console.log(error)
//                 return sendServerError(res)
//             }
//     }    
// )

/**
* @route PUT /api/add-inventory/:warehouseId
* @description add productshipment to a warehouse
* @access private
*/
warehouseRoute.put('/add-inventory/:warehouseId/', verifyToken, verifyStorekeeper,
    async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId
            const warehouse = await Warehouse.findById(warehouseId)
            if (!warehouse) return sendError(res, "The warehouse not found.")
            if (warehouse.storekeeper == req.user.role._id) {
                let { productShipmentId } = req.body
                const productShipment = await ProductShipment.findById(productShipmentId)
                if (!productShipment) return sendError(res, "The product shipment not found.")
                const bills = await Bill.find()
                let turnover
                for (let i = 0; i < bills.length; i++) {
                    for (let j = 0; j < bills[i].product_shipments.length; j++) {
                        if (bills[i].product_shipments[j].shipment == productShipmentId) {
                            turnover = bills[i].product_shipments[j].turnover;
                            break;
                        }
                    }
                }
                const product_shipments = warehouse.inventory_product_shipments
                let shipments = []
                for (let x = 0; x < product_shipments.length; x++) {
                    shipments.push(product_shipments[x].shipment)
                }
                let shipmentToString = shipments.toString()
                if (product_shipments.length == 0) {
                    let add = { shipment: productShipment, turnover: turnover }
                    const totalTurnover = warehouse.turnover + Number(turnover)
                    let inventory_product_shipments = [...warehouse.inventory_product_shipments, add]
                    await Warehouse.findByIdAndUpdate(warehouseId, { inventory_product_shipments: inventory_product_shipments, turnover: totalTurnover })
                    return sendSuccess(res, "Add product shipment successfully.")
                } else {
                    if (shipmentToString.includes(productShipmentId)) {
                        return sendError(res, "The shipment is existed in warehouse.")
                    } else {
                        let add = { shipment: productShipment, turnover: turnover }
                        const totalTurnover = warehouse.turnover + Number(turnover)
                        let inventory_product_shipments = [...warehouse.inventory_product_shipments, add]
                        await Warehouse.findByIdAndUpdate(warehouseId, { inventory_product_shipments: inventory_product_shipments, turnover: totalTurnover })
                        return sendSuccess(res, "Add product shipment successfully.")
                    }
                }
            } else {
                return sendError(res, "Access denied.")
            }
        } catch (error) {
            console.log(error)
            return sendServerError(res)
        }
    })

/**
* @route PUT /api//update-inventory/:warehouseId
* @description export or import productshipment to a warehouse
* @access private
*/
warehouseRoute.put('/update-inventory/:warehouseId', verifyToken, verifyStorekeeper,
    async (req, res) => {
        const warehouseId = req.params.warehouseId
        const warehouse = await Warehouse.findById(warehouseId)
        if (!warehouse) { return sendError(res, "The warehouse not found.") }
        if (warehouse.storekeeper == req.user.role._id) {
            try {
                const { productShipmentId, status } = req.body
                if (status != 'import' && status != 'export') return sendError(res, "Status must be 'import' or 'export'")
                const warehouse = await Warehouse.findById(warehouseId)
                const productShipment = await ProductShipment.findById(productShipmentId)
                if (!productShipment) return sendError(res, "The product shipment not found.")
                for (let i = 0; i < warehouse.inventory_product_shipments.length; i++) {
                    if (warehouse.inventory_product_shipments[i].shipment == productShipmentId) {
                        if (warehouse.inventory_product_shipments[i].status == status) {
                            return sendError(res, "Status already set.")
                        }
                        warehouse.inventory_product_shipments[i].status = status
                        warehouse.turnover = warehouse.turnover + (status == 'import' ? +warehouse.inventory_product_shipments[i].turnover : -warehouse.inventory_product_shipments[i].turnover)
                        await Warehouse.findByIdAndUpdate(warehouseId, { inventory_product_shipments: warehouse.inventory_product_shipments, turnover: warehouse.turnover })
                        return sendSuccess(res, `${status} successfully`)
                    }
                };
                return sendError(res, "This product shipment can not be found in this warehouse.")
            }
            catch (error) {
                return sendServerError(res)
            }
        } else {
            return sendError(res, "Access denied.")
        }

    })

export default warehouseRoute