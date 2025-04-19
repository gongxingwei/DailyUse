<template>
    <div id='login-view'>
        <v-container fluid class="login-container">
            <v-row justify="center" align="center" height="100vh">
                <v-col cols="12" sm="8" md="4">
                    <v-card>
                        <v-card-title class="text-h5">登录</v-card-title>
                        <v-card-text>
                            <LoginForm />
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
<script setup lang="ts">
import { useAuthStore } from '../stores/authStore';
import LoginForm from '../components/LoginForm.vue';
import RegisterForm from '../components/RegisterForm.vue';
import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';

</script>

<style scoped>
#login-view {
    height: 100vh;
    width: 100%;

}
.login-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}
</style>