// AuthTypes.ts
export type RegisterUserRequest = {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    phone: string;
};

export type LoginUserRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    access_token: string;
    token_type: "bearer" | string;
    expires_in?: number; // segundos
};

export const TOKEN_KEY = "access_token";
export const EXPIRES_KEY = "access_token_expires_at"; // epoch ms
