import Bill from "../model/Bill.js"
import Road from "../model/Road.js"
import Warehouse from "../model/Warehouse.js"

//auto update status bill when comple
export const updateStatusBill = async (id) => {
    try {
        const bill = await Bill.findById(id)
        const road = await Road.findOne({road: bill.road})
        const warehouse = await Warehouse.findById(road.destination)
        var listinventory_product_shipments =''
        for (let index = 0; index < warehouse.inventory_product_shipments.length ; index++) {
         listinventory_product_shipments  += warehouse.inventory_product_shipments[index].shipment.toString()
        }
        console.log(listinventory_product_shipments)
        var checkBill;
        for (let index = 0; index < bill.product_shipments.length; index++) {
         const listproduct_shipments = bill.product_shipments[index].shipment.toString()
        checkBill =  listinventory_product_shipments.includes(listproduct_shipments)
        console.log(checkBill)
        if(checkBill == false)
            checkBill == false
        else
            checkBill == true
        }
        if(checkBill == true){
            await Bill.findByIdAndUpdate(bill._id,{status: 'completed'})
        }
        else{
        return sendError(res,"Status watting")}
    } catch (error) {
        console.log(error)
    }
}
