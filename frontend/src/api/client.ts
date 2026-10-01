const API_BASE_URL = "http://127.0.0.1:8000"

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("hisabai-token")

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...options.headers,
      },
    },
  )

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      errorText ||
        `Request failed with status ${response.status}`,
    )
  }

  return response.json() as Promise<T>
}
