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

const getTokenPayload = (data) => {
  return {
    email: data.email ?? null,
    userId: data.id ?? null,
  };
};

const createSessionAndTokens = async (user, meta) => {
  const jti = uuidv4();

  const payload = getTokenPayload(user);

  const accessToken = generateToken(payload, ACCESS_TOKEN_EXPIRES_IN);

  const refreshToken = generateToken(payload, REFRESH_TOKEN_EXPIRES_IN, {
    jwtid: jti,
  });

  const refreshTokenHash = await generateHash(refreshToken);

  await authRepository.createSession({
    userId: user.id,
    jti,
    refreshTokenHash,
    ipAddress: meta.ipAddress || null,
    userAgent: meta.userAgent || null,
    revoked: false,
    expiresAt: new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN)),
  });

  delete user.password;

  return { accessToken, refreshToken, user };
};

const register = async (data) => {
  const { email, password, username, ipAddress, userAgent } = data;

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const passwordHash = await generateHash(password);

  const user = await authRepository.createUser({
    email,
    password: passwordHash,
    username,
  });

  return await createSessionAndTokens(user, { ipAddress, userAgent });
};

const login = async (data) => {
  const { email, password, ipAddress, userAgent } = data;

  const user = await authRepository.findUserByEmail(email);

  if (!user || !(await compareHash(password, user.password))) {
    throw new AppError("Invalid credentials", 401);
  }

  return await createSessionAndTokens(user, { ipAddress, userAgent });
};

const refreshToken = async ({ refreshToken, ipAddress, userAgent }) => {
  let decoded;

  try {
    decoded = verifyToken(refreshToken);
  } catch {
    throw new AppError("Session expired", 401);
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

export default { register, login, refreshToken, getMe };
