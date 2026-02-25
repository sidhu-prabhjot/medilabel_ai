import api from "./axios";

export const loginUser = async (email: String, password: String) => {
  await api
    .post("/auth/login", {
      email,
      password,
    })
    .then((response) => {
      console.log(response);
      return response.data;
    })
    .catch((error) => {
      console.log("ERROR" + error);
    });
};
