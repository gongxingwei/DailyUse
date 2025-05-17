export interface IUser {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ILoginForm {
    username: string;
    password: string;
    remember: boolean;
}

export interface IRegisterForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}