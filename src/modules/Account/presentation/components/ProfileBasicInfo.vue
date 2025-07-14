<template>
    <v-card class="pa-4">
        <v-card-title class="text-h5 text-center">基本信息</v-card-title>
        <v-card-text>

        </v-card-text>
        <v-list>


            <v-list-item class="text-center">
                <v-avatar size="96" class="mb-4" color="primary">
                    <template v-if="userBasicInfo.avatarUrl">
                        <img :src="userBasicInfo.avatarUrl" alt="用户头像" />
                    </template>
                    <template v-else>
                        <span class="default-avatar-text">
                            {{ userBasicInfo.username ? userBasicInfo.username.charAt(0).toUpperCase() : '?' }}
                        </span>
                    </template>
                </v-avatar>
            </v-list-item>

            <v-list-item>
                <v-text-field v-model="userBasicInfo.uuid" label="uid" readonly prepend-inner-icon="mdi-identifier"
                    density="comfortable" />
            </v-list-item>

            <v-list-item>
                <v-text-field v-model="userBasicInfo.username" label="用户名" clearable required
                    prepend-inner-icon="mdi-account" density="comfortable" />
            </v-list-item props='label'>

            <v-list-item>
                <v-textarea v-model="userBasicInfo.bio" label="个人简介" clearable prepend-inner-icon="mdi-account-details"
                    density="comfortable" />
            </v-list-item>

            <v-list-item>
                <v-row>
                    <v-col cols="12" sm="6">
                        <v-menu v-model="dateMenu" :close-on-content-click="false" transition="scale-transition"
                            offset-y min-width="290px">
                            <template #activator="{ props }">
                                <v-text-field v-model="formattedBirthday" label="生日"
                                    prepend-inner-icon="mdi-cake-variant" readonly v-bind="props" density="comfortable"
                                    clearable required />
                            </template>
                            <v-date-picker v-model="userBasicInfo.birthday" @update:modelValue="onDateSelected"
                                @input="dateMenu = false" locale="zh-CN" />
                        </v-menu>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="userBasicInfo.sex" :items="sexOptions" item-title='text' item-value="value"
                            label="性别" clearable prepend-inner-icon="mdi-gender-male-female" density="comfortable" />
                    </v-col>
                </v-row>

            </v-list-item>

            <v-list-item>
                <v-row>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="userBasicInfo.email" label="邮箱" clearable required
                            prepend-inner-icon="mdi-email" density="comfortable" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="userBasicInfo.phone" label="手机号" clearable required
                            prepend-inner-icon="mdi-phone" density="comfortable" />
                    </v-col>
                </v-row>
            </v-list-item>
        </v-list>
    </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';

import { useAccountStore } from '../stores/accountStore';

const accountStore = useAccountStore();

const dateMenu = ref(false);
const userBasicInfo = reactive({
    avatarUrl: '',
    uuid: '',
    username: '',
    bio: '',
    email: '',
    phone: '',
    sex: '',
    birthday: '',
});

const sexOptions = [
    { text: '男', value: '1' },
    { text: '女', value: '0' },
    { text: '其他', value: '2' }
];


const formattedBirthday = computed(() => {
    if (!userBasicInfo.birthday) return '';
    const date = new Date(userBasicInfo.birthday);
    console.log('formatter值变化', formattedBirthday.value);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
});

function onDateSelected(val: string) {
    userBasicInfo.birthday = val;
    dateMenu.value = false;
}

watch(() => userBasicInfo.birthday, (newVal) => {
    if (newVal) {
        console.log('生日变化:', newVal);
        const date = new Date(newVal);
        userBasicInfo.birthday = date.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD

    }
});

onMounted(() => {
    // 初始化用户基本信息
    console.log('accountStore.account:', accountStore.account);
    if (accountStore.account) {
        userBasicInfo.avatarUrl = accountStore.account.user.avatar || '';
        userBasicInfo.uuid = accountStore.account.id || '';
        userBasicInfo.username = accountStore.account.username || '';
        userBasicInfo.bio = accountStore.account.user.bio || '';
        userBasicInfo.email = accountStore.account.email?.value || '';
        userBasicInfo.phone = accountStore.account.phoneNumber?.number || '';
        userBasicInfo.sex = accountStore.account.user.sex || '';

    }
    console.log('userBasicInfo:', userBasicInfo);
})
</script>