import { successResponse } from "../../utils/apiResponse.js";
import ratingService from "./rating.service.js";

const getUserRatings = async (req, res) => {
  const userId = req.user.id;

  const result = await ratingService.getUserRatings(userId);

  return successResponse(res, 200, result, "Rating data found");
};

export default { getUserRatings };
