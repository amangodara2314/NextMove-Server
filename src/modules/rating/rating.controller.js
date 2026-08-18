import { successResponse } from "../../utils/apiResponse";
import ratingService from "./rating.service";

const getUserRatings = async (req, res) => {
  const userId = req.user.userId;

  const result = await ratingService.getUserRatings(userId);

  return successResponse(res, 200, result, "Rating data found");
};

export default { getUserRatings };
