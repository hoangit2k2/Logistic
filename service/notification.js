import schedule from "node-schedule"
import { sendError, sendServerError, sendAutoMail, sendSuccess, sendAutoSMS } from "../helper/client.js"
import User from "../model/User.js"
import Car from "../model/Car.js"
import CarFleet from "../model/CarFleet.js"
import Bill from "../model/Bill.js"
import Notification from "../model/Notification.js"
import { io } from "socket.io-client"
import { NOTIFY_EVENT } from "../constant.js"
export const sendMailToCafllet = async() => {
    try {

    const listcar = await Car.find({})
        for (let index = 0; index < listcar.length; index++) {
            var day = 7
            const endtime = listcar[index]['insurance']['expired']
            const starttime = new Date
            starttime.setDate(endtime.getDate() - day)      
            var j = schedule.scheduleJob({ start: starttime, end: endtime, rule: '* * */24 * * *' }, async function () {
                const idcarfleet = listcar[index]['car_fleet'] + ''
                const car_fleet = await CarFleet.findById(idcarfleet)
                const idstaff = car_fleet['director'] + ''
                const user = await User.find({ role: idstaff })
                user.toString()
                var b = JSON.stringify(user);
                var c = b.substring(1, b.length - 1);
                var d = JSON.parse(c);
                try {
                    if(d.email){
                    const notification = {
                        to: d.email,
                        subject: "Xe " + listcar[index]['plate'] + " Sắp hết hạn vui lòng đăng ký lại",
                        html: `<p>Bạn cần đăng ký lại bảo hiểm xe trước ngày </p>` + listcar[index]['insurance']['expired']
                    }
                    const sendMailSuccess = await sendAutoMail(notification)
                    console.log(notification)
                    console.log('gui thanh cong')
                    if(!sendMailSuccess) sendError(res,'Send Mail to carfleet Faild')
                    }
                    else{
                        const notification = {
                            to:d.phone,
                            body: ` Xe  ${listcar[index]['plate']} Sắp hết hạn vui lòng đăng ký lại. Bạn cần đăng ký lại bảo hiểm xe trước ngày ${listcar[index]['insurance']['expired']}`
                        }
                        const sendSMSSucsses = await sendAutoSMS(notification)
                        if(!sendSMSSucsses) sendError(res,'Send SMS to Carfleer Faild')

                    }
                    const conten =  ` Xe  ${listcar[index]['plate']} Sắp hết hạn vui lòng đăng ký lại. Bạn cần đăng ký lại bảo hiểm xe trước ngày ${listcar[index]['insurance']['expired']}`
                    const socket = io(process.env.SOCKET_SERVER,{reconnection: true});
                    socket.emit(NOTIFY_EVENT.send,d._id,{conten})
                } catch (error) {
                    sendServerError(res)
                }
                const receiver = d._id;
                const title = "Xe " + listcar[index]['plate'] + " Sắp hết hạn vui lòng đăng ký lại"
                const message = `Bạn cần đăng ký lại bảo hiểm xe trước ngày` + listcar[index]['insurance']['expired']
                await Notification.create({receiver, title, message })
console.log(oke)
           
            })
            
        }
        
    } catch (error) {
        console.log(error)
    }
}
export const sendMailToDriver = async() => {
    try {
        const listBill = await Bill.find({status: "waiting"}) 
        for(let i=0; i< listBill.length; i++) {            
            const starttime = new Date
            const endtime = new Date
            endtime.setDate(endtime.getDate() + 1) 
            var j = schedule.scheduleJob({ start: starttime, end: endtime, rule: '* * */24 * * *' }, async function () {
                let driverId = listBill[i].driver+'';
                let id = listBill[i]._id + '';
                let user = await User.find({role:driverId})        
                user.toString()
                var b = JSON.stringify(user);
                var c = b.substring(1, b.length - 1);
                var d = JSON.parse(c);     

                let drvierEmail = d.email   
                let drvierPhone = d.phone   

                try{
                    if(drvierEmail){
                        const notification = {
                            to: drvierEmail,
                            subject: "Tài xế nhận bill",
                            html: `<p>Bạn cần nhận bill </p>` + id
                        }
                        const sendMailSuccess = await sendAutoMail(notification)
                        console.log(notification)
                        console.log('Send successfully')
                        if(!sendMailSuccess) sendError(res,'Send Mail to driver failed')
                    }
                    else{
                        const notification = {
                            to: drvierPhone,
                            body: `Bạn cần nhận bill  ${id}`
                        }
                        const sendSMSSucsses = await sendAutoSMS(notification)
                        if(!sendSMSSucsses) sendError(res,'Send SMS to driver failed')
                    }
                    const content = `Tài xế nhận bill  ${id}`
                    const socket = io(process.env.SOCKET_SERVER,{reconnection: true});
                    //console.log(driverId)
                    socket.emit(NOTIFY_EVENT.send,driverId,{content})
                }catch(error) {
                    sendServerError(res)
                }   
                const receiver = driverId;
                const title = "Tài xế nhận bill"
                const message = `Bạn cần nhận bill  ${id}`
                await Notification.create({receiver, title, message })
            })         
        }    
    } catch (error) {
        console.log(error)
    }
}