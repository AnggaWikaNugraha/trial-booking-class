const SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY must be set");
  return key;
}

export type SnapTransactionInput = {
  orderId: string;
  grossAmount: number;
  itemName: string;
  customer: { firstName: string; email: string };
};

export type SnapTransaction = { token: string; redirect_url: string };

export async function createSnapTransaction(input: SnapTransactionInput): Promise<SnapTransaction> {
  const res = await fetch(SNAP_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
      item_details: [
        { id: "trial-class", price: input.grossAmount, quantity: 1, name: input.itemName.slice(0, 50) },
      ],
      customer_details: { first_name: input.customer.firstName, email: input.customer.email },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Midtrans Snap ${res.status}: ${(body.error_messages ?? []).join("; ")}`);
  }
  return body;
}
