import AppError from "../utils/AppError.js";

// error map
const errorMap = (issue, ctx) => {
  if (issue.code === "invalid_string" && issue.validation === "email") {
    return { message: "Invalid email format" };
  }

  if (issue.code === "too_small") {
    return { message: `Minimum is ${issue.minimum}` };
  }

  return { message: ctx.defaultError };
};

// returns a middleware to validate the payload
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(
    {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    { errorMap },
  );

  if (!result.success) {
    const formatted = result.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(new AppError("Validation failed", 400, formatted));
  }

  req.body = result.data.body;
  req.params = result.data.params;

  next();
};

export default validate;
