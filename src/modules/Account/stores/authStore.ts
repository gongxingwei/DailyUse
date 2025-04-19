import { defineStore } from 'pinia';
import { authService } from '../services/authService';
import type { IUser, ILoginForm, IRegisterForm } from '../types/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as IUser | null,
        loading: false,
        error: null as string | null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        currentUser: (state) => state.user,
    },

    actions: {
        async register(form: IRegisterForm) {
            this.loading = true;
            this.error = null;
            try {
                if (form.password !== form.confirmPassword) {
                    throw new Error('两次输入的密码不一致');
                }
                await authService.register(form);
                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : '注册失败';
                return false;
            } finally {
                this.loading = false;
            }
        },
        async login(credentials: ILoginForm) {
            this.loading = true;
            this.error = null;
            try {
                const user = await authService.login(credentials);
                this.user = user;
                return true;
            } catch (error) {
                this.error = error instanceof Error ? error.message : '登录失败';
                return false;
            } finally {
                this.loading = false;
            }
        },
        
        async logout() {
            try {
                await authService.logout();
            } finally {
                this.user = null;
            }
        },

        async checkAuth() {
            try {
                const user = await authService.checkAuth();
                this.user = user;
            } catch (error) {
                this.user = null;
            }
        },
    },

    persist: true,
});