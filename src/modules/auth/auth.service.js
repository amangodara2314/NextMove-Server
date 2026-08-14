import { RatingType } from "@prisma/client";
import prisma from "../../config/prisma.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../../constants/env.js";
import AppError from "../../utils/AppError.js";
import { compareHash, generateHash } from "../../utils/hash.js";
import parseDuration from "../../utils/parseDuration.js";
import { generateToken, verifyToken } from "../../utils/token.js";
import authRepository from "./auth.repository.js";
import { v4 as uuidv4 } from "uuid";
import oauth2Client from "../../config/googleAuth.js";

const getTokenPayload = (data) => {
  return {
    email: data.email ?? null,
    userId: data.id ?? null,
  };
};

const verifyGoogleToken = async (code) => {
  try {
    const googleResult = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleResult.tokens);

    const userResult = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleResult.tokens.access_token}`,
        },
      },
    );
    const userInfo = await userResult.json();
    return userInfo;
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw new AppError("Invalid Google token", 401);
  }
};

const createSessionAndTokens = async (user, meta) => {
  const jti = uuidv4();

  const payload = getTokenPayload(user);

  const accessToken = generateToken(payload, ACCESS_TOKEN_EXPIRES_IN);

  const refreshToken = generateToken(payload, REFRESH_TOKEN_EXPIRES_IN, {
    jwtid: jti,
  });

  const refreshTokenHash = await generateHash(refreshToken);

  const session = await authRepository.createSession({
    userId: user.id,
    jti,
    refreshTokenHash,
    ipAddress: meta.ipAddress || null,
    userAgent: meta.userAgent || null,
    revoked: false,
    expiresAt: new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN)),
  });

  await authRepository.revokeOtherSessions(user.id, session.id);

  delete user.password;

  return { accessToken, refreshToken, user };
};

const register = async (data) => {
  const {
    email,
    password = null,
    username,
    ipAddress,
    userAgent,
    isVerified = false,
    isGoogleAuth = false,
  } = data;

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const userData = {
    email,
    username,
    isVerified,
  };

  if (!isGoogleAuth) {
    if (!password)
      throw new AppError(
        "Password is required for non-Google registration",
        400,
      );
    const passwordHash = await generateHash(password);
    userData.password = passwordHash;
  }
  const ratingData = Object.values(RatingType).map((type) => ({
    type,
  }));

  const user = await authRepository.createUser(null, { userData, ratingData });

  return await createSessionAndTokens(user, { ipAddress, userAgent });
};

const login = async (data) => {
  const { email, password, ipAddress, userAgent } = data;

  const user = await authRepository.findUserByEmail(email);

  if (!user || !(await compareHash(password, user.password))) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isVerified) {
    throw new AppError(
      "User email is not verified. Please verify your email.",
      403,
    );
  }

  return await createSessionAndTokens(user, { ipAddress, userAgent });
};

const refreshToken = async ({ refreshToken, ipAddress, userAgent }) => {
  let decoded;

  try {
    decoded = verifyToken(refreshToken);
    if (!decoded) {
      throw new Error("Invalid token");
    }
  } catch {
    throw new AppError("Session expired. Please login again.", 401);
  }

  const { userId, jti } = decoded;

  const session = await authRepository.findSession({
    where: { jti },
  });

  // No session, possible reuse attack
  if (!session || session.revoked) {
    await authRepository.revokeAllSessions(userId);
    throw new AppError("Session compromised. Please login again.", 401);
  }

  const isValid = await compareHash(refreshToken, session.refreshTokenHash);

  // Hash mismatch, reuse attack
  if (!isValid) {
    await authRepository.revokeAllSessions(userId);
    throw new AppError("Session compromised. Please login again.", 401);
  }

  // Rotate token
  await authRepository.updateSession({ id: session.id }, { revoked: true });

  const user = await authRepository.findUserById(userId);

  return await createSessionAndTokens(user, { ipAddress, userAgent });
};

const getMe = async (userId) => {
  const user = await authRepository.findUserById(userId, {
    select: {
      id: true,
      email: true,
      username: true,
    },
    include: {
      rating: true,
    },
  });
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
};

const googleRegister = async (data) => {
  const { code, userAgent, ipAddress } = data;
  const payload = await verifyGoogleToken(code);
  console.log("Google token payload:", payload);
  const { email, name, picture, email_verified } = payload;

  if (!email || !name || !email_verified) {
    throw new AppError("Invalid Google token payload", 400);
  }

  return register({
    email,
    username: name,
    isVerified: true,
    isGoogleAuth: true,
    ipAddress,
    userAgent,
  });
};

export default { register, login, refreshToken, getMe, googleRegister };
