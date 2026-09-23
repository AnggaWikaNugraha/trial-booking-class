import { getBooking } from "@/lib/data/get-booking";
import { isUuid, jsonError } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/bookings/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(400, "Invalid booking id");

  const booking = await getBooking(id);
  if (!booking) return jsonError(404, "Booking not found");
  return Response.json({ booking });
}
