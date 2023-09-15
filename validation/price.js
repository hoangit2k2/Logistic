import Error from "../helper/error.js"


export const createPriceValidate = data => {
    const error = new Error()

    error.isRequired(data.kg, 'kg')
    .isRequired(data.ton, 'ton')
    .isRequired(data.m3, 'm3')
    .isRequired("kg.*.next")  
    .isRequired("kg.*.sidestep")  
    .isRequired("kg.*.prices")
    for (let i = 0; i < 4; i++) {
        error.isRequired("ton.*.prices["+i+"]") 
    }
    error.isRequired("ton.*.next")  
    .isRequired("ton.*.sidestep")  
    .isRequired("ton.*.prices")  
    for (let i = 0; i < 4; i++) {
        error.isRequired("ton.*.prices["+i+"]") 
    }
    error.isRequired("m3.*.next")  
    .isRequired("m3.*.sidestep")  
    .isRequired("m3.*.prices")  
    for (let i = 0; i < 4; i++) {
        error.isRequired("ton.*.prices["+i+"]") 
    }

    return error.get()
}
