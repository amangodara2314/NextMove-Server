class AppError extends Error {
  /**
   *
   * @param {string} message - Error message
   * @param {number} statusCode - Http status code
   * @param {*} errors - errors array
   */
  constructor(
    message = "Something went wrong",
    statusCode = 500,
    errors = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

export default AppError;
