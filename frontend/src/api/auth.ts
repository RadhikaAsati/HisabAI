import { apiRequest } from "./client"

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  user: {
    user_id: number
    name: string
    email: string
  }
  shop_id: number
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  })

  localStorage.setItem("hisabai-token", response.access_token)

  return response
}

export function logout() {
  localStorage.removeItem("hisabai-token")
}
