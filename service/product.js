export const handleProductInfo = async product => {
    if(!product) return product
    const deepproduct = { ...product._doc }
    try {
        product = await product.populate('product_shipments')
        return product
    } catch (error) {
        console.log(error)
        return deepproduct
    }
}