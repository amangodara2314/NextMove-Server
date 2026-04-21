import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../constants/env";

const generateHash = async (password) => {
  return await bcrypt.hash(password, parseInt(SALT_ROUNDS));
};

export { generateHash };
