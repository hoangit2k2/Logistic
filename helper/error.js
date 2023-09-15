export default class Error {
    constructor() {
        this.errors = []
        this.checkRequire = true
    }

    /**
     * @param field : field to validate
     * @param name : default is param field's name
     * @returns this
     */
    isRequired(field, name) {
        if (field == null || field == undefined) this.appendError(`${name} field is required.`)
        // if(this.checkRequire)   this.checkRequire = false
        return this
    }

    /**
     * @param field: field to validate
     * @param name: default is param field's name
     * @returns this
     */
    isRedundant(field, name) {
        if (field) this.appendError(`${name} field is redundant.`)
        return this
    }

    /**
     * @param lstFieldAndName : list of objects include field and name key
     * @returns this
     */
    isOnlyRequiredOneOf(lstFieldAndName) {
        if (!lstFieldAndName.some(ele => ele.field != null || ele.field != undefined)) {
            let errorlog = ''
            lstFieldAndName.forEach((ele, idx) => {
                if (idx < lstFieldAndName.length - 1)
                    errorlog += ele.name + ' or '
                else errorlog += ele.name
            })
            this.appendError(`${errorlog} is required.`)
        }
        return this
    }

    /**
     * @param field: field to validate
     * @param range: range of values which field belong to
     * @returns this
     */
    isInRange(field, range) {
        if (field)
            if (!Object.values(range).includes(field))
                this.appendError(`system does not understand value of ${field}.`)
        return this
    }

    /**
     * @param field: field to validate
     * @param name : default is param field's name
     * @param minlength: min length of text field
     * @param maxlength: max length of text field
     * @returns this
     */
    isValidLength(field, name, minlength, maxlength) {
        if (field && !(field.length >= minlength && field.length <= maxlength))
            this.appendError(`the length of ${name} field is invalid. the valid field has ${minlength}-${maxlength} characters.`)
        return this
    }

    /**
     * check a field whether is an object
     * @param field: field to validate
     * @param name : default is param field's name
     * @param objectKeys: array of required keys, each key can be a multiple option (split by slash '/')
     * @return this
     */
    isRequiredObject(field, name, objectKeys = []) {
        if (field == null || field == undefined) {
            this.appendError(`${name} field is required.`)
            return this
        }
        if (typeof field === 'object') {
            objectKeys.forEach(requiredKey => {
                if (requiredKey.includes('/')) {
                    const optKeys = requiredKey.split('/')
                    if (!optKeys.some(key => Object.keys(field).includes(key))) {
                        this.appendError(`the field ${name} doesn't have the key ${requiredKey}.`)
                    }
                }
                else if (!Object.keys(field).includes(requiredKey)) {
                    this.appendError(`the field ${name} doesn't have the key ${requiredKey}.`)
                }
            })
        }
        else this.appendError(`the field ${name} has an incorrect form.`)
        return this
    }

    /**
     * check a field whether is an array of objects
     * @param field: field to validate
     * @param name : default is param field's name
     * @param objectKeys: array of required keys, each key can be a multiple option (split by slash '/')
     * @return this
     */
    isRequiredObjectArray(field, name, minQuantity = 0, objectKeys = []) {
        if (field == null || field == undefined) {
            this.appendError(`${name} field is required.`)
            return this
        }
        if (Array.isArray(field)) {
            if (field.length >= minQuantity) {
                field.forEach((ele, idx) => {
                    if (typeof ele === 'object') {
                        objectKeys.forEach(requiredKey => {
                            if (requiredKey.includes('/')) {
                                const optKeys = requiredKey.split('/')
                                if (!optKeys.some(key => Object.keys(ele).includes(key))) {
                                    this.appendError(`${name}: the element at index ${idx} doesn't have the key ${requiredKey}.`)
                                }
                            }
                            else if (!Object.keys(ele).includes(requiredKey)) {
                                this.appendError(`${name}: the element at index ${idx} doesn't have the key ${requiredKey}.`)
                            }
                        })
                    }
                    else this.appendError(`${name}: the element at index ${idx} has an incorrect form.`)
                })
            }
            else this.appendError(`${name} must has at least ${minQuantity} element.`)
        }
        else this.appendError(`${name} must be an array of object elements.`)
        return this
    }

    /**
     * check a field number has value in range
     * @param field: field to validate
     * @param name : default is param field's name
     * @param {Object{min, max}} range: limited range
     * @return this
     */
    isRequiredAndInRangeOfNumber(field, name, range = { min: null, max: null }) {
        if (field == null || field == undefined) {
            this.appendError(`${name} field is required.`)
            return this
        }
        if(isNaN(field) == true){
            this.appendError(`${name} field is Not avaliable.` )
           return this
       }
        const { min, max } = range
        if (min) {
            if (field < min)
                this.appendError(`${name} is not in range of number.`)
            if (max) {
                if (field > max)
                    this.appendError(`${name} is not in range of number.`)
            }
        }
        else {
            if (max) {
                if (field > max)
                    this.appendError(`${name} is not in range of number.`)
            }
        }
        return this
    }

    /**
     * check a field array of numbers has value in range
     * @param field: field to validate
     * @param name : default is param field's name
     * @return this
     */
    isRequiredAndInRangeOfArrayNumber(field, name) {
        if (field == null || field == undefined || !Array.isArray(field)) {
            this.appendError(`${name} field is required and must be an array.`)
        }
        return this
    }

    appendError(message) {
        this.errors.push(message)
    }

    get() {
        return this.errors.length > 0 ? this.errors : null
    }

    /**
     * @param id: field is objectId in model
     * @return this
     */
        checklenghid(id){
            if(id.length != 24){
                this.appendError(`${id} field id Not avaliable`)
            return this

            }

        }
}