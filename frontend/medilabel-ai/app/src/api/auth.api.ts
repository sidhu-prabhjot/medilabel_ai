import api from "./axios";
import { LoginResponse } from "../types/auth";

export const loginUser = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.log("ERROR" + error);
    throw error;
  }
};

export const signupUser = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/api/auth/signup", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
