import Warehouse from "../model/Warehouse.js";


export const calculateWarehouseTurnover = async (warehouseId) => {
   try { 
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {return sendError(res,"No warehouse found");}
    let sum = 0;
    for (let i = 0; i < warehouse.inventory_product_shipments.length; i++) {
        if (warehouse.inventory_product_shipments[i].status == "import") {
            sum += (warehouse.inventory_product_shipments[i].turnover)
        }
    }
    return sum
    }
    catch (err) {
        console.log(err);
    }
}
