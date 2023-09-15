import Product from "../model/Product.js"

/**
 * check whether create product shipment
 * @param {Array[Number]} quantityList list of numbers, which are the quantity of each shipment
 * @param {Product} product product need to be divided
 * @returns {boolean}
 */
export const canCreateProductShipment = (quantityList, product) => {
    if (quantityList.length > 0 && quantityList.every(val => val > 0) && product.quantity !== quantityList.reduce((a, b) => a + b, 0))
        return false
    return true
}

/**
 * handle shipment information
 * @param {ProductShipment} shipment
 * @returns {Object}
 */
 export const handleShipmentInfo = async shipment => {
    if(!shipment) return shipment
    const deepShipment = { ...shipment._doc }
    try {
        const product = await Product.findOne({ product_shipments: { $in: shipment._id }}).select('name')
        return { ...deepShipment, product_name: product.name }
    } catch (error) {
        console.log(error)
        return deepShipment
    }
}