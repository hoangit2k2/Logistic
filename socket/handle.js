import { NOTIFY_EVENT } from "../constant.js"
import { SOCKET_SESSIONS } from "../index.js"

export const handleDisconnect = (socket) => {
    const delInx = SOCKET_SESSIONS.findIndex(val => val.socketId === socket.id)
    SOCKET_SESSIONS.splice(delInx, 1)
}

export const addSocketSession = (socket, userId) => {
    SOCKET_SESSIONS.push({ socketId: socket.id, userId })
}

export const sendNotify = (io, userId, data) => {
    SOCKET_SESSIONS.forEach(val => {
        if (val.userId == userId) {
            // console.log(val.socketId, userId, data)
            io.to(val.socketId).emit(NOTIFY_EVENT.receive, data)
        }
    })
}