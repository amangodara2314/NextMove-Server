/**
 * Send a success response
 * @param {object} res - Express Response object
 * @param {number} statusCode - Http status code
 * @param {object} data - Response data
 * @param {string} message - Response message
 */

export const successResponse = async (
  res,
  statusCode = 200,
  data,
  message = "Success",
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

// /**
//  * Send error response
//  * @param {object} res - Express Response object
//  * @param {number} statusCode - Http status code
//  * @param {object} errors - Error details
//  * @param {string} message - Response message
//  */

// export const errorResponse = (
//   res,
//   statusCode = 500,
//   errors = null,
//   message = "Internal Server Error",
// ) => {
//   return res.status(statusCode).json({
//     success: false,
//     message,
//     errors,
//   });
// };
