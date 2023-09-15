import Error from "../helper/error.js";

export const carFleetValidate = (data) => {
  const error = new Error()

    .isRequired(data.name, "name")
    .isRequired(data.director, "director");

  return error.get();
};
