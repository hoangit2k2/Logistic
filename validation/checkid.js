import Error from "../helper/error.js";

export const checkidobject = data =>{
    const error = new Error();
    error.checklenghid(data)
    return error.get()

}