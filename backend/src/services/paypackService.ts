const PAYPACK_BASE = "https://api.paypack.rw";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${PAYPACK_BASE}/api/auth/agents/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_APP_ID,
      client_secret: process.env.PAYPACK_APP_SECRET,
    }),
  });

  if (!res.ok) throw new Error("Paypack auth failed");
  const data = await res.json() as { access: string };
  cachedToken = data.access;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min
  return cachedToken;
}

export async function initiateCashin(phone: string, amount: number): Promise<{ ref: string }> {
  const token = await getToken();
  const res = await fetch(`${PAYPACK_BASE}/api/transactions/cashin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, number: phone }),
  });

  const data = await res.json() as { ref?: string; message?: string };
  if (!res.ok) throw new Error(data?.message || "Cashin initiation failed");
  return { ref: data.ref as string };
}

export async function verifyTransaction(ref: string): Promise<"pending" | "successful" | "failed"> {
  const token = await getToken();
  const res = await fetch(`${PAYPACK_BASE}/api/transactions/find/${ref}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return "pending";
  const data = await res.json() as { status?: string };
  const status = data.status?.toLowerCase();
  if (status === "successful") return "successful";
  if (status === "failed") return "failed";
  return "pending";
}
