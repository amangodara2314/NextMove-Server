import app from "./app.js";
import prisma from "./config/prisma.js";
import validateEnv from "./utils/validateEnv.js";
const PORT = process.env.PORT || 5000;

const testDbConnection = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err) {
    console.log("Database connection failed :", err.message);
    process.exit(1);
  }
};

const startServer = async () => {
  validateEnv();
  await testDbConnection();
  app.listen(PORT, () => console.log("Server is running on port " + PORT));
};

process.on("uncaughtException", (err) => {
  console.log("uncaughtException Error :", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("unhandledRejection Error :", err);
  process.exit(1);
});

// handle graceful shutdown
process.on("SIGINT", async (err) => {
  await prisma.$disconnect();
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGTERM", async (err) => {
  await prisma.$disconnect();

  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

startServer();
