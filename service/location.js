import opencage from "opencage-api-client"
import Warehouse from "../model/Warehouse.js"
const OPENCAGE_API_KEY = '7f8d6f65dfd846748331d3c5e0a52070'

export const locateAddress = async (address) => {
    try {
        const data = await opencage.geocode({ q: `${address}`, key: OPENCAGE_API_KEY })
        if (data.status.code == 200 && data.results.length > 0) {
            if (!data.results[0].geometry) {
                return null
            }
            else {
                return data.results[0].geometry // { lat: "value", lng: "value"}                
            }
        }
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * find the warehouse which is the nearest one with provided address
 * @param {*} origin
 * @param {*} destination
 * @returns {Warehouse} the nearest warehouse
 */
export const findNearestWarehouse = async (address) => {
    try {
        let lat = null, lon = null
        const coor = await locateAddress(`${address.street},${address.ward},${address.district},${address.province}`)
        if (coor) {
            lat = coor.lat
            lon = coor.lng

            const whs = await Warehouse.find()
            let minDistance = Infinity
            let nearestWh = null
            for (const wh of whs) {
                const distance = calculateDistance(lat, lon, wh.lat, wh.lon)
                if (minDistance > distance) {
                    minDistance = distance
                    nearestWh = wh
                }
            }
            return nearestWh
        }
        return null
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * calculate distance by coordinates of two places
 * @param {Number} latA 
 * @param {Number} lonA 
 * @param {Number} latB 
 * @param {Number} lonB 
 * @returns distance between two places, unit km
 */
export const calculateDistance = (latA, lonA, latB, lonB) => {
    var R = 6371; // km
    var dLat = toRad(latB - latA);
    var dLon = toRad(lonB - lonA);
    var latA = toRad(latA);
    var latB = toRad(latB);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(latA) * Math.cos(latB);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

const toRad = val => val * Math.PI / 180