
export class RegisterUserRequest{
    name!: string;
    username!: string;
    email!: string;
    password!: string;
    token?: string;
}

export class LoginUserRequest {
    username!: string;
    password!: string;
}

export class UpdateUserRequest {
    username?: string;
    name?: string;
    email?: string
    password?: string;
    role?: string;
    avatar?: string;
}

export class UserResponse {
    id!: string;
    username!: string;
    name!: string;
    email!: string;
    role!: string;
    avatar?: string | null;
    token?: string | null;
}