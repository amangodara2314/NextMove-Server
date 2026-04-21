import rtkOptions from "../../constants/rtkOptions.js";
import authService from "./auth.service.js";

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.register({
      email,
      password,
    });

    res.cookies("refreshToken", refreshToken, rtkOptions);

    successResponse(res, 201, { accessToken, user }, "Registered successfully");
  } catch (error) {
    errorResponse(
      res,
      error.statusCode || 500,
      error.errors || null,
      error.message,
    );
  }
};
