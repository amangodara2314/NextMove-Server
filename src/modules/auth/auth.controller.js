import rtkOptions from "../../constants/rtkOptions.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import authRepository from "./auth.repository.js";
import authService from "./auth.service.js";

const register = async (req, res) => {
  const { email, password, username } = req.body;
  const { accessToken, refreshToken, user } = await authService.register({
    email,
    password,
    username,
  });

  res.cookie("refreshToken", refreshToken, rtkOptions);

  successResponse(res, 201, { accessToken, user }, "Registered successfully");
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await authService.login({
    email,
    password,
  });

  console.log("login user :", refreshToken, user);

  res.cookie("refreshToken", refreshToken, rtkOptions);

  successResponse(res, 200, { accessToken, user }, "Login successful");
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AppError("Invalid token. Please login again", 401);
  }

  const {
    accessToken,
    refreshToken: newRefreshToken,
    user,
  } = await authService.refreshToken({
    refreshToken,
  });

  res.cookie("refreshToken", newRefreshToken, rtkOptions);

  successResponse(
    res,
    200,
    { accessToken, user },
    "Token refreshed successfully",
  );
};

const getMe = async (req, res) => {
  const userId = req?.user?.userId;
  if (!userId) {
    throw new AppError("userId not found", 404);
  }
  const result = await authRepository.findUserById(userId, {
    omit: { password: true },
  });
  const token = req?.token;
  successResponse(res, 200, { user: result, accessToken: token }, "User found");
};

export default { register, login, refreshToken, getMe };
