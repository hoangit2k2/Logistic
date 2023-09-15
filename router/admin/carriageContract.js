import express from "express";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import carriageContract from "../../model/CarriageContract.js";
import {carriageContractValidate} from "../../validation/carriageContract.js"


const CarriageContractAdminRoute = express.Router();
/**
 * @route GET /api/admin/carriagecontract/
 * @description get carriagecontract
 * @access private
 */
 CarriageContractAdminRoute.get("/", async (req, res) => {
      try {
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
        const page = req.query.page ? parseInt(req.query.page) : 0;
        const { keyword, sortBy, department, car_maintenance} = req.query;
        var query = {};
        var keywordCondition = keyword
          ? {
              $or: [
                { car_fix: { $regex: keyword, $options: "i" } },
                { car_maintenance: { $regex: keyword, $options: "i" } },
                { fee: { $regex: keyword, $options: "i" } },
                { toll_fee: { $regex: keyword, $options: "i" } },
                { fuel_Fee: { $regex: keyword, $options: "i" } },
              ],
            }
          : {};
        if (car_maintenance) {
          query.car_maintenance = car_maintenance;
        }
        const carriagecontract = await carriageContract.find({ $and: [query, keywordCondition] })
            .limit(pageSize)
            .skip(pageSize * page)
            .sort(`${sortBy}`);
        var length = await carriageContract.find({ $and: [query, keywordCondition] }).count();
        if (carriagecontract)
          return sendSuccess(res, "Get carriageContract information successfully.", {
            length,
            carriagecontract,
          });
          return sendError(res, "carriageContract information is not found.");
      } catch (error) {
          console.log(error);
          return sendServerError(res);
      }
    });
/**
 * @route POST /api/admin/carriagecontract/create
 * @description register new carriagecontract
 * @access private
 */
 CarriageContractAdminRoute.post("/create", 
            async (req, res) => {
     try{
     const {car_maintenance, leases,type_fee} = req.body
      const error = carriageContractValidate(req.body)
      if(error) return sendError(res, error)
      await carriageContract.create({
            car_maintenance: car_maintenance,
            type_fee : type_fee,
            leases: leases
      });
      return sendSuccess(res, "carriageContract successfully.", {
            car_maintenance: car_maintenance,
            type_fee : type_fee,
            leases: leases
      });
     }catch(error){
      console.log(error);
      return sendServerError(res)
     }
});

 /**
 * @route PUT /api/admin/carriageContract/:id
 * @description UPDATE carriageContract
 * @access private
 */
  CarriageContractAdminRoute.put("/:id", async (req, res) => {
    const {id} = req.params
    const {car_maintenance, type_fee , leases} = req.body
    const error = carriageContractValidate(req.body)
    if(error) return sendError(res, error)
    try{
         const CarriageContract = await carriageContract.findById({_id:id});
         if(CarriageContract) {
          await carriageContract.findByIdAndUpdate(id, {
            car_maintenance: car_maintenance,
            type_fee: type_fee,
            leases: leases
          });
          return sendSuccess(res, "Update carriagecontract successfully.", CarriageContract);
         }
          return sendError(res, "carriagecontract does not exist!")
    }catch(error){
      return sendServerError(res)
    }
  });
/**
 * @route DELETE /api/admin/movingcontract/:id
 * @description DELETE movingcontract
 * @access private
 */  
 CarriageContractAdminRoute.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const isExist = await carriageContract.exists({ _id: id });
    if (!isExist) return sendError(res, "carriageContract does not exist.");
    const CarriageContract = await carriageContract.findByIdAndRemove(id)
    return sendSuccess(res, "Delete carriageContract successfully.", CarriageContract);
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});
export default CarriageContractAdminRoute;