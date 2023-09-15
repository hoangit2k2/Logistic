import { ORDER_STATUS, PICK_UP_AT, PRODUCT_UNIT } from "../constant.js"
import Error from "../helper/error.js"

export const createOrderValidate = data => {
    const error = new Error()

    error.isRequired(data.service, 'service')
        .isRequiredObject(data.sender, 'sender', ['name', 'phone'])
        .isRequiredObject(data.receiver, 'receiver', ['name', 'phone'])
        .isRequiredObject(data.origin, 'origin', ['loading', 'address'])
        .isRequiredObject(data.destination, 'destination', ['unloading', 'address'])
        .isRequiredObjectArray(data.products, 'products', 1, ['name', 'quantity', 'unit'])

    if (!error.get()) {
        error.isInRange(data.origin.loading, PICK_UP_AT)
            .isInRange(data.destination.unloading, PICK_UP_AT)
        if (data.origin.loading === PICK_UP_AT.SHIP)
            error.isRequiredObject(data.origin.address, "origin's address", ['street', 'ward', 'district', 'province'])
        else if (data.origin.loading === PICK_UP_AT.ON_SITE)
            error.isValidLength(data.origin.address, "origin's address", 24, 24)
        if (data.destination.unloading === PICK_UP_AT.SHIP)
            error.isRequiredObject(data.destination.address, "destination's address", ['street', 'ward', 'district', 'province'])
        else if (data.destination.unloading === PICK_UP_AT.ON_SITE)
            error.isValidLength(data.destination.address, "destination's address", 24, 24)
    }

    if (!error.get())
        data.products.forEach(product => {
            error.isInRange(product.unit, PRODUCT_UNIT)
            error.isRequiredAndInRangeOfNumber(product.quantity, 'quantity of a product', { min: 1 })
        })

    return error.get()
}

export const updateOrderValidate = data => {
    const error = new Error()

    error.isRequiredObject(data.sender, 'sender', ['name', 'phone'])
        .isRequiredObject(data.receiver, 'receiver', ['name', 'phone'])
        .isRequiredObject(data.origin, 'origin', ['loading', 'address'])
        .isRequiredObject(data.destination, 'destination', ['unloading', 'address'])
        .isRequiredObjectArray(data.products, 'products', 1, ['name', 'quantity', 'unit'])

    if (!error.get()) {
        error.isInRange(data.origin.loading, PICK_UP_AT)
            .isInRange(data.destination.unloading, PICK_UP_AT)
        if (data.origin.loading === PICK_UP_AT.SHIP)
            error.isRequiredObject(data.origin.address, "origin's address", ['street', 'ward', 'district', 'province'])
        else if (data.origin.loading === PICK_UP_AT.ON_SITE)
            error.isValidLength(data.origin.address, "origin's address", 24, 24)
        if (data.destination.unloading === PICK_UP_AT.SHIP)
            error.isRequiredObject(data.destination.address, "destination's address", ['street', 'ward', 'district', 'province'])
        else if (data.destination.unloading === PICK_UP_AT.ON_SITE)
            error.isValidLength(data.destination.address, "destination's address", 24, 24)
    }

    if (!error.get())
        data.products.forEach(product => {
            error.isInRange(product.unit, PRODUCT_UNIT)
            error.isRequiredAndInRangeOfNumber(product.quantity, 'quantity of a product', { min: 1 })
        })

    return error.get()
}

export const updateOrderStatusValidate = data => {
    const error = new Error()

    error.isRequired(data.status, 'status')
        .isInRange(data.status, ORDER_STATUS)

    return error.get()
}