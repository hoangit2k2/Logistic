import Error from "../helper/error.js";

export const sendNotificationValidate = (data) => {
  const error = new Error();

  error
    .isRequired(data.receiverId, "Receiver's ID")
    .isRequired(data.title, "title")
    .isRequired(data.message, "message");

  return error.get();
};

