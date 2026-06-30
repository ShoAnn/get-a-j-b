import { LoginResponse, LoginResponseSchema, RegisterResponse, RegisterResponseSchema } from "@/types/auth";
import { apiClient } from "./apiClient";

export async function handleLogin(email: string, password: string): Promise<LoginResponse> {
	return apiClient.post("/api/auth/login", LoginResponseSchema, { email, password })
}

export async function handleRegister(registerInput: RegisterResponse): Promise<RegisterResponse> {
	return apiClient.post("/api/auth/register", RegisterResponseSchema, registerInput)
}

