import Error from "../helper/error.js";

export const careerValidate = (data) => {
  const error = new Error()

    .isRequired(data.name, "name")
    .isRequired(data.type, "type")
    .isRequired(data.description, "description")
    .isRequired(data.location, "location")
    .isRequired(data.state, "state")
    .isRequired(data.bonus, "bonus")
    .isRequired(data.deadline, "deadline");

  return error.get();
};
