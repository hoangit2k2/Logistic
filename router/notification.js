import express from "express";
import { io } from "socket.io-client";
import { NOTIFY_EVENT } from "../constant.js";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import Notification from "../model/Notification.js";
import User from "../model/User.js";
import { sendNotificationValidate } from "../validation/notification.js";

const notificationRoute = express.Router();

notificationRoute.post("/", async (req, res) => {
  const errors = sendNotificationValidate(req.body);
  if (errors) return sendError(res, errors);

  const { receiverId, title, message, link } = req.body;
  const sender = req.user.id;

  try {
    const existReceiver = await User.exists({ _id: receiverId });
    if (existReceiver) {
      await Notification.create({
        sender,
        receiver: receiverId,
        title,
        message,
        link,
      });
      const socket = io(process.env.SOCKET_SERVER, { reconnection: true });
      socket.emit(NOTIFY_EVENT.send, receiverId, { title, message, link });
      return sendSuccess(res, "Send the notification successfully.");
    }
    return sendError(res, "Receiver's ID didn't exist.", 404);
  } catch (error) {
    console.log(error.message);
    return sendServerError(res);
  }
});

notificationRoute.get("/", async (req, res) => {
  const limit = req.query.limit || 15;
  const userId = req.user.id;

  try {
    const notifications = await Notification.find({ receiver: userId })
      .sort({ updatedAt: -1 })
      .limit(limit);
    return sendSuccess(res, "Request successfully.", notifications);
  } catch (error) {
    return sendServerError(res);
  }
});

export default notificationRoute;

