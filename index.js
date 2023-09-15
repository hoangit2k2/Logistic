import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import YAML from 'yamljs'
import { Server } from 'socket.io'
import bodyParser from 'body-parser'
import { sendMailToCafllet, sendMailToDriver } from "./service/notification.js"


import session from "express-session"
// import path from "path"
// const __dirname = path.resolve(path.dirname(''))
import authRoute from "./router/auth.js"
import adminRoute from "./router/admin/index.js"
import trackingRoute from "./router/tracking.js"
import orderRoute from "./router/order.js"
import aboutRoute from "./router/about.js"
import publicRoute from "./router/public.js"
import contactUsRoute from "./router/contactUs.js"
import commitmentRoute from "./router/commitment.js"
import partnerRoute from "./router/partner.js"
import contactMsgRoute from "./router/contactMsg.js"
import consultancyRoute from "./router/consultancy.js"
import quoteRoute from "./router/quote.js"
import warehouseRoute from "./router/warehouse.js"
import applicantRoute from "./router/applicant.js"
import careerRoute from "./router/career.js"
import departmentRoute from "./router/department.js"
import participantRoute from "./router/participant.js"
import productRoute from "./router/product.js"
import featureRoute from "./router/feature.js"
import distanceRoute from "./router/distance.js"
import priceRoute from "./router/price.js"
import priceListRoute from "./router/pricelist.js"
import serviceRoute from "./router/service.js"
import customerRoute from "./router/customer.js"
import turnoverRoute from "./router/turnover.js"
import billRoute from "./router/bill.js"
import carriageContractRoute from "./router/carriageContract.js"

// swagger setup
import swaggerUi from 'swagger-ui-express'
const swaggerDocument = YAML.load('./swagger.yaml')

import { verifyAdmin, verifyToken } from "./middleware/index.js"
import userRoute from "./router/user.js"
import prohibitedProductRoute from "./router/prohibitedProduct.js"

import { clearTokenList } from "./service/jwt.js"
import { NOTIFY_EVENT, SESSION_AGE } from "./constant.js"
import { addSocketSession, handleDisconnect, sendNotify } from "./socket/handle.js"
import notificationRoute from "./router/notification.js"
dotenv.config()

/**
 * Connect MongoDB
 */
mongoose.connect(process.env.MONGO_URI)
const db = mongoose.connection
db.on('error', () => console.log('MongoDB connection error.'))
db.once('open', () => {
    console.log('Connected to MongoDB successfully.')
})

const PORT = process.env.PORT || 8000
const DEV = process.env.DEV == 1
export const TOKEN_LIST = {}
export const TOKEN_BLACKLIST = {}
export const SOCKET_SESSIONS = []
const app = express()
const io = new Server(process.env.SOCKET_PORT, {
    cors: {
        origin: '*'
    }
})
const store = new session.MemoryStore()

app.use(session({
    secret: process.env.SESSION_NAME,
    cookie: { maxAge: SESSION_AGE },
    saveUninitialized: false,
    store,
    resave: false
}))
app.use(express.json())
app.use(cors(
    {
        origin: process.env.DEV == 1 ? 'http://localhost:3000' : [`http://${process.env.HOST}`, `https://${process.env.HOST}`],

        credentials: true
    }
))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
    .use('/api/public', publicRoute)
    .use('/api/admin', verifyToken, verifyAdmin, adminRoute)
    .use('/api/auth', authRoute)
    .use('/api/tracking', trackingRoute)
    .use('/api/order', orderRoute)
    .use('/api/about', aboutRoute)
    .use('/api/contactus', contactUsRoute)
    .use('/api/commitment', commitmentRoute)
    .use('/api/partner', partnerRoute)
    .use('/api/message', contactMsgRoute)
    .use('/api/consultancy', consultancyRoute)
    .use('/api/quote', quoteRoute)
    .use('/api/warehouse', warehouseRoute)
    .use('/api/user', userRoute)
    .use('/api/prohibited-product', prohibitedProductRoute)
    .use('/api/applicant', applicantRoute)
    .use('/api/career', careerRoute)
    .use('/api/department', departmentRoute)
    .use('/api/participant', participantRoute)
    .use('/api/feature', featureRoute)
    .use('/api/notification', verifyToken, notificationRoute)
    .use('/api/product', productRoute)
    .use('/api/distance', distanceRoute)
    .use('/api/price', priceRoute)
    .use('/api/pricelist', priceListRoute)
    .use('/api/service', serviceRoute)
    .use('/api/customer', customerRoute)
    .use('/api/turnover', turnoverRoute)
    .use('/api/bill', billRoute)

    .use("/api/carriageContract", carriageContractRoute)
app.use('/*', async (req, res) => {
    res.status(501).send("Don't implement.")
})

// app.use(express.static(path.join(__dirname, process.env.BUILD_DIST)));

// app.get('/*', async (req, res) => {
//     try {
//         res.sendFile(path.join(__dirname, process.env.BUILD_DIST + 'index.html'))
//     } catch (error) {
//         console.log(error.message)
//         res.sendStatus(500)
//     }
// })

io.on(NOTIFY_EVENT.connection, socket => {
    // console.log('Connected to a user successfully.')

    socket.on(NOTIFY_EVENT.disconnect, () => {
        handleDisconnect(socket)
    })

    socket.on(NOTIFY_EVENT.addSession, userId => {
        addSocketSession(socket, userId)
    })

    socket.on(NOTIFY_EVENT.send, (userId, data) => {
        sendNotify(io, userId, data)
    })
})

app.listen(PORT, () => {
    console.log(`Server start at port: ${PORT}`)
})
app.listen(() => {
    sendMailToCafllet()
})
app.listen(() => {
    sendMailToDriver()
})
setInterval(() => {
    clearTokenList(TOKEN_BLACKLIST)
}, 3600000)