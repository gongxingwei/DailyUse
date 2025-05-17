export const validateUsername = (username: string): boolean => {
    return !!username && username.length >= 3 && username.length <= 20;
};

export const validatePassword = (password: string): boolean => {
    return !!password && password.length >= 8 && password.length <= 20;
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!email && emailRegex.test(email);
};