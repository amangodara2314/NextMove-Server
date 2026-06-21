import { parseISO } from "date-fns";
import { utc } from "@date-fns/utc"; // Required if using date-fns v4+

/**
 * Prepares any date input (String, Date object, or Timestamp)
 * into a safe, normalized UTC ISO string for database storage.
 */
export function prepareDateForDb(inputDate) {
  if (!inputDate) return null;

  // Handle string inputs safely
  const dateObj =
    typeof inputDate === "string" ? parseISO(inputDate) : new Date(inputDate);

  // Validate the date to prevent writing 'Invalid Date' to the database
  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid date provided for database storage.");
  }

  // Returns exact UTC representation: YYYY-MM-DDTHH:mm:ss.sssZ
  return dateObj.toISOString();
}
