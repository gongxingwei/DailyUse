<template>
    <div id="register-view">
        <v-container fluid class="register-container">
            <v-row justify="center" align="center" height="100vh">
                <v-col cols="12" sm="8" md="4">
                    <v-card>
                        <v-card-title class="text-h5">注册</v-card-title>
                        <v-card-text>
                            <RegisterForm />
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
<script setup lang="ts">
import RegisterForm from '../components/RegisterForm.vue';
</script>
<style lang="css" scoped>
#register-view {
    height: 100vh;
    width: 100%;
}
.register-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}
</style>