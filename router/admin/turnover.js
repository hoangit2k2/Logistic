import express, { query } from "express";
import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import Turnover from "../../model/Turnover.js";
// import { paidValidate } from "../../validation/turnover.js";
import Bill from "../../model/Bill.js";
import Order from "../../model/Order.js";
import Car from "../../model/Car.js";
import CarFleet from "../../model/CarFleet.js";
import CarRepair from "../../model/CarRepair.js";
import Warehouse from "../../model/Warehouse.js";
import { BILL_STATUS } from "../../constant.js";
import { checkidobject } from "../../validation/checkid.js";
const turnoverAdminRoute = express.Router();



/**
 * @route GET /api/turnover
 * @description get turnover information
 * @access public
 */
turnoverAdminRoute.get("/", async (req, res) => {
  try {
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 0;
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const { keyword, sortBy, payment_method, type_of_turnover } = req.query;
    var query = {};
    var keywordCondition = keyword
      ? {
        $or: [
          { payment_method: { $regex: keyword, $options: "i" } },
          { type_of_turnover: { $regex: keyword, $options: "i" } },
          { message: { $regex: keyword, $options: "i" } },
        ],
      }
      : {};
    if (payment_method) {
      query.payment_method = payment_method;
    }
    if (type_of_turnover) {
      query.type_of_turnover = type_of_turnover;
    }
    const turnover = await Turnover.find({ $and: [query, keywordCondition] })
      .limit(pageSize)
      .skip(pageSize * page)
      .sort(`${sortBy}`)
      .populate("bill")
      .populate("order");
    const length = await Turnover.find({ $and: [query, keywordCondition] }).count();
    return sendSuccess(res, "Get turnover information successfully.", {
      length,
      turnover,
    });
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});
/**
 * @route GET /api/turnover/:id
 * @description get a single turnover information
 * @access public
 */
turnoverAdminRoute.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const turnover = await Turnover.findById({ _id: id }).populate(['order', 'bill']);
    if (turnover) {
      return sendSuccess(
        res,
        "get turnover information successfully.",
        turnover,
      );
    }
    return sendError(res, "turnover information is not found.");
  } catch (error) {
    console.log(error);
    return sendServerError(res);
  }
});
/**
 * @router GET /api/turnover/car/:carid
 * @description get turnover car by id car
 * @access private
 */
turnoverAdminRoute.get("/car/:carid", async (req, res) => {
  try {
    const { carid } = req.params
    const error = checkidobject(carid)
    if(error) return sendError(res, error)
    const {fromdate, todate } = req.query
    var query = {};
    if (fromdate) {
      query.createdAt = {$gte : fromdate,$lt : todate};
    }
    let shipments = []
    let turnover = 0
    let actual_fuel = 0
    let carrepairPrice = 0
    const car = await Car.findById({ _id: carid })
    if (!car) return sendError(res, "Carid Not Found")
    console.log(query)
    const carrepair = await CarRepair.find({
      car: carid, $and:[query]
    })
    console.log(carrepair)
    for (let i = 0; i < carrepair.length; i++) {
      carrepairPrice += carrepair[i].price
    }
    const bill = await Bill.find({
      car: carid, status: BILL_STATUS.completed,$and:[query]
    })
    // get list shipment in bill and get actual_fuel
    for (let i = 0; i < bill.length; i++) {
      const shipments1 = bill[i].product_shipments
      actual_fuel += bill[i].actual_fuel
      shipments.push(...shipments1)
    }
    //get turnover
    for (let i = 0; i < shipments.length; i++) {
      turnover += shipments[i].turnover
    }
    const Profit = turnover - actual_fuel - carrepairPrice
    sendSuccess(res, "Get Turnover Successfully",
      {
        "Name Car": car.plate,
        "Total revenue": turnover,
        "Acctual Fuel": actual_fuel,
        "Carrepair": carrepairPrice,
        "Profit": Profit

      }
    )
  } catch (error) {
    console.log(error)
    sendServerError(res)
  }
})

/**
 * @router GET /api/turnover/carfleet/:carfleetid
 * @description get turnover cafllet by carleetid
 * @access private
 */
turnoverAdminRoute.get("/carfleet/:carfleetid", async (req, res) => {
  try {
    const { carfleetid } = req.params
    const error = checkidobject(carfleetid)
    if(error) return sendError(res, error)
    const {fromdate, todate } = req.query
    var query = {};
    if (fromdate) {
      query.createdAt = {$gte : fromdate,$lt : todate};
    }
    const cafleets = await CarFleet.findById({ _id: carfleetid })
    if (!cafleets) return sendError(res, "CarFleet not found")
    const bill = cafleets.bills
    const car = await Car.find({ car_fleet: carfleetid })
    console.log(car)
    let bills = []
    let shipments = []
    let actual_fuels = 0
    let totalturnover = 0
    let totalPriceRepair = 0
    let carrepairs = []
    //get carrepair have car
    for (let i = 0; i < car.length; i++) {
      const idcar = car[i]._id
      const carrepair = await CarRepair.find({
        car: idcar,$and:[query]
      })
      carrepairs.push(...carrepair)
    }
    // console.log(carrepairs)
    for (let x = 0; x < carrepairs.length; x++) {
      const priceRepair = carrepairs[x].price
      totalPriceRepair += priceRepair
    }
    //get list bill has status completed
    for (let index = 0; index < bill.length; index++) {
      const bills1 = await Bill.find({
        _id: bill[index], status: BILL_STATUS.completed,$and:[query]
      })
      bills.push(...bills1)
      console.log(bills1)
    }
    // console.log("List Bill" + bills)
    //getshipment in bill has status
    for (let i = 0; i < bills.length; i++) {
      const shipment1 = bills[i].product_shipments
      const actual_fuel = bills[i].actual_fuel

      actual_fuels += actual_fuel

      shipments.push(...shipment1)
    }
    //get list turnover
    // console.log("Shipment: " + shipments)
    for (let j = 0; j < shipments.length; j++) {
      const turnover = shipments[j].turnover
      totalturnover += turnover
    }
    const profit = totalturnover - actual_fuels - totalPriceRepair
    sendSuccess(res, "Turnover Carfleet: ",
      {
        "Name Cafleet": cafleets.name,
        "Total revenue": totalturnover,
        "Acctual Fuel": actual_fuels,
        "ToTalPriceRepair": totalPriceRepair,
        "Profit": profit
      })
  } catch (error) {
    console.log(error)
    sendServerError(error)
  }
})

/**
 * @router GET /api/turnover/enterprise
 * @description get turnover 
 * @access private
 */
turnoverAdminRoute.get("/enterprise/total", async (req, res) => {
  try {
    let total_price = 0
    let total_pricecarrepair = 0
    let total_pricefuel = 0
    const { fromdate, todate } = req.query
    var query = {};
    if (fromdate) {
      query.createdAt = {$gte : fromdate,$lt : todate};
    }
    //get turnover order status status completed
    const order = await Order.find({
      status: BILL_STATUS.completed,$and:[query]
    }
    )
    for (let i = 0; i < order.length; i++) {
      total_price += order[i].total_price
    }
    const carrepair = await CarRepair.find({$and:[query]});
    for (let j = 0; j < carrepair.length; j++) {
      total_pricecarrepair += carrepair[j].price
    }
    const bill = await Bill.find({$and:[query]})
    for (let z = 0; z < bill.length; z++) {
      console.log(bill[z].theoretical_fuel)
      total_pricefuel += bill[z].theoretical_fuel
    }
    const profit = total_price - total_pricecarrepair - total_pricefuel
    sendSuccess(res, "Get turnover Successfully"
      , {
        "Total revenue": total_price,
        "Theoretical fuel": total_pricefuel,
        "Carrepair": total_pricecarrepair,
        "Profit": profit
      })

  } catch (error) {
    console.log(error)
    sendServerError(res)
  }
})
/**
 * @router Get /api/turnover/warehouse
 * @description get turnover
 * @access private
 */
turnoverAdminRoute.get("/warehouse/:idwarehouse", async(req, res) => {
    try {
      const {idwarehouse} = req.params
      const error = checkidobject(idwarehouse)
      if(error) return sendError(res, error)
      const warehouse = await Warehouse.findById({_id: idwarehouse})

      return sendSuccess(res, "Get Turnover sucessfully",{
        "Name": warehouse.name,
        "Turnover": warehouse.turnover
      })
    } catch (error) {
      console.log(error)
      sendServerError(res)
    }
} )

// /**
//  * @route DELETE /api/admin/turnover/:id
//  * @description delete an existing turnover
//  * @access private
//  */
// turnoverAdminRoute.delete("/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const isExist = await Turnover.exists({ _id: id });
//     if (!isExist) return sendError(res, "Turnover does not exist.");
//     await Turnover.findByIdAndRemove(id)
//       .then(() => {
//         return sendSuccess(res, "Delete turnover successfully.");
//       })
//       .catch((err) => {
//         return sendError(res, err);
//       });
//   } catch (error) {
//     console.log(error);
//     return sendServerError(res);
//   }
// });

// /**
//  * @route PUT /api/admin/turnover/order/:orderId
//  * @description update with transportation cost information
//  * @access public
//  */
// turnoverAdminRoute.put("/order/:orderId", async (req, res) => {
//   const turnoverId = req.query.turnoverId;
//   const orderId = req.params.orderId;
//   try {
//     const order = await Order.findById(orderId);
//     const turnover = await Turnover.findById(turnoverId).populate("order");
//     if (!order) {
//       return sendError(res, "order not found");
//     }
//     if (turnover) {
//       var formerCost = 0;
//       if (turnover.order) {
//         const formerOrder = turnover.order;
//         formerCost = formerOrder.total_price;
//       }
//       const cost = order.total_price;
//       const total = turnover.total + cost - formerCost;
//       await Turnover.findByIdAndUpdate(turnover._id, {
//         total: total,
//         order: order,
//       });
//       if (total)
//         return sendSuccess(
//           res,
//           "Updated turnover with transportation cost information successfully.",
//           { total }
//         );
//       return sendError(res, "Cost information is not found.");
//     }
//     return sendError(res, "Turnover is not found.");
//   } catch (error) {
//     console.log(error);
//     return sendServerError(res);
//   }
// });

// /**
//  * @route PUT /api/admin/turnover/bill/:billId
//  * @description update with bill cost information
//  * @access public
//  */
// turnoverAdminRoute.put("/bill/:billId", async (req, res) => {
//   const turnoverId = req.query.turnoverId;
//   const billId = req.params.billId;
//   try {
//     const bill = await Bill.findById(billId).populate("product_shipments");
//     const turnover = await Turnover.findById(turnoverId).populate("bill");
//     if (!bill) {
//       return sendError(res, "bill not found");
//     }
//     if (turnover) {
//       var formerCost = 0;
//       if (turnover.bill) {
//         const formerBill = turnover.bill;
//         const formerShipments = formerBill.product_shipments;
//         if (formerShipments.length) {
//           for (let i = 0; i < formerShipments.length; i++) {
//             formerCost += formerShipments[i].turnover;
//           }
//         }
//       }
//       const shipments = bill.product_shipments;
//       var cost = 0;
//       if (shipments.length) {
//         for (let i = 0; i < shipments.length; i++) {
//           cost += shipments[i].turnover;
//         }
//       }
//       const total = turnover.total + cost - formerCost;
//       await Turnover.findByIdAndUpdate(turnover._id, {
//         total: total,
//         bill: bill,
//       });
//       if (cost)
//         return sendSuccess(
//           res,
//           "Updated turnover with bill information successfully.",
//           { total }
//         );
//       return sendError(res, "Cost information is not found.");
//     }
//     return sendError(res, "Turnover is not found.");
//   } catch (error) {
//     console.log(error);
//     return sendServerError(res);
//   }
// });

// /**
//  * @route PUT /api/admin/turnover/paid/:id
//  * @description update paid field of an existing turnover
//  * @access private
//  */
// turnoverAdminRoute.put("/paid/:id", async (req, res) => {
//   const { id } = req.params;
//   const errors = paidValidate(req.body);
//   if (errors) return sendError(res, errors);
//   let { paid } = req.body;
//   try {
//     const turnover = await Turnover.findById(id);
//     if (turnover) {
//       var formerPaid = 0;
//       if (turnover.paid) {
//         formerPaid = turnover.paid;
//       }
//       var tempPaid = paid - formerPaid;
//       var total = turnover.total;
//       if (total === 0) {
//         return sendError(res, "Turnover total is already paid.");
//       }
//       var refund = turnover.refund;
//       // total never below 0
//       if (tempPaid > total) {
//         refund += tempPaid - total;
//         total = 0;
//         tempPaid = 0;
//       }
//       total -= tempPaid;
//       await Turnover.findByIdAndUpdate(id, {
//         paid: paid,
//         total: total,
//         refund: refund,
//       });
//       return sendSuccess(res, "Update turnover successfully.", {
//         paid,
//         total,
//         refund,
//       });
//     }
//     return sendError(res, "Turnover does not exist.");
//   } catch (error) {
//     console.log(error);
//     return sendError(res);
//   }
// });

export default turnoverAdminRoute;
