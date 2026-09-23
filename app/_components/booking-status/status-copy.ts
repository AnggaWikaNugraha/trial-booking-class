import type { Tone } from "../primitive/badge";

export const STATUS_COPY: Record<string, { label: string; detail: string; tone: Tone }> = {
  pending_payment: {
    label: "Awaiting payment",
    detail: "No seat is held yet. The seat is taken only once the payment is confirmed.",
    tone: "neutral",
  },
  confirmed: {
    label: "Confirmed",
    detail: "The payment went through and the seat is yours. See you in class.",
    tone: "success",
  },
  payment_failed: {
    label: "Payment failed",
    detail: "The payment was denied, cancelled, or expired. You can book this class again.",
    tone: "danger",
  },
  rejected_class_full: {
    label: "Class was already full",
    detail:
      "The payment went through, but someone else took the last seat first. This payment needs a refund.",
    tone: "warning",
  },
};
