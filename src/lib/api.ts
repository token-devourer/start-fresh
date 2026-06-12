import { API_BASE_URL } from "./config";

export interface RoomLookup {
  code: string;
  roomId: string;
}

export async function createRoom(): Promise<RoomLookup> {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Room could not be created."));
  }

  return response.json() as Promise<RoomLookup>;
}

export async function resolveRoom(code: string): Promise<RoomLookup> {
  const response = await fetch(`${API_BASE_URL}/rooms/${code.toUpperCase()}`);

  if (!response.ok) {
    throw new Error(await readError(response, "Room was not found."));
  }

  return response.json() as Promise<RoomLookup>;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
}
