import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../../constants/env.js";
import { generateHash } from "../../utils/hash.js";
import { generateToken } from "../../utils/token.js";
import authRepository from "./auth.repository.js";

const register = async (data) => {
  const { email, password } = data;
  // check if user already exists
  const existingUser = await authRepository.findUserByEmail(email, {
    include: { id: true },
  });

  if (existingUser) {
    throw new Error({
      message: "User with this email already exists.",
      statusCode: 409,
    });
  }

  // hash password
  const passwordHash = await generateHash(password);

  // create user
  const user = await authRepository.createUser(email, passwordHash);

  // generate access and refresh tokens
  const accessTokenPayload = {
    userId: user.id,
    email: user.email,
  };
  const accessToken = generateToken(
    accessTokenPayload,
    ACCESS_TOKEN_EXPIRES_IN,
  );

  const refreshTokenPayload = {
    userId: user.id,
  };
  const refreshToken = generateToken(
    refreshTokenPayload,
    REFRESH_TOKEN_EXPIRES_IN,
  );

  // create session with refresh token hash
  const refreshTokenHash = await generateHash(refreshToken);
  await authRepository.createSession({
    userId: user.id,
    refreshTokenHash,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    expiresAt: new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN)),
  });

  // Remove password from user object before returning
  delete user.password;

  return { accessToken, refreshToken, user };
};

export default { register };
