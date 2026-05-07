const requiredEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "PORT",
  "SALT_ROUNDS",
  "JWT_SECRET",
  "ACCESS_TOKEN_EXPIRES_IN",
  "REFRESH_TOKEN_EXPIRES_IN",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "SOCKET_RATE_LIMIT",
];

const validateEnv = () => {
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    console.error("Missing required environment variables");
    missingEnv.forEach((key) => console.error(`- ${key}`));
    process.exit(1);
  }
};

export default validateEnv;
