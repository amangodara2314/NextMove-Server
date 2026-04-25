import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../constants/env.js";

const generateHash = async (value) => {
  return await bcrypt.hash(value, parseInt(SALT_ROUNDS));
};

const compareHash = async (value, hash) => {
  return await bcrypt.compare(value, hash);
};

export { generateHash, compareHash };
