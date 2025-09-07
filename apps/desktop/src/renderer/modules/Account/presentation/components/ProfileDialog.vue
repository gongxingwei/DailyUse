<template>
    <v-dialog :model-value="modelValue" width="500">
        <v-card class="pa-4">
            <v-card-title class="text-h5 text-center">用户信息</v-card-title>
            <v-card-text>

            </v-card-text>
            <v-form ref="formRef">
                <v-list>
                    <v-list-item class="text-center">
                        <v-avatar size="96" class="mb-4" color="primary">
                            <template v-if="localUser?.avatar">
                                <img :src="localUser.avatar" alt="用户头像" />
                            </template>
                            <template v-else>
                                <span class="default-avatar-text">
                                    {{ '?' }}
                                </span>
                            </template>
                        </v-avatar>
                    </v-list-item>
                    <v-list-item>
                        <v-textarea v-model="localUser!.bio" label="个人简介" clearable
                            prepend-inner-icon="mdi-account-details" density="comfortable" />
                    </v-list-item>

                    <v-list-item>
                        <v-row>
                            <!-- <v-col cols="12" sm="6">
                            <v-menu v-model="dateMenu" :close-on-content-click="false" transition="scale-transition"
                                offset-y min-width="290px">
                                <template #activator="{ props }">
                                    <v-text-field v-model="formattedBirthday" label="生日"
                                        prepend-inner-icon="mdi-cake-variant" readonly v-bind="props"
                                        density="comfortable" clearable required />
                                </template>
                                <v-date-picker v-model="localAccount?.user.birthday" @update:modelValue="onDateSelected"
                                    @input="dateMenu = false" locale="zh-CN" />
                            </v-menu>
                        </v-col> -->
                            <v-col cols="12" sm="6">
                                <v-select v-model="localUser!.sex" :items="sexOptions" item-title='text'
                                    item-value="value" label="性别" clearable prepend-inner-icon="mdi-gender-male-female"
                                    density="comfortable" />
                            </v-col>
                        </v-row>

                    </v-list-item>
                </v-list>
            </v-form>

            <v-card-actions class="justify-center">
                <v-btn color="primary" @click="handleSaveProfile">保存</v-btn>
                <v-btn text @click="$emit('update:modelValue', false)">取消</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { User } from '../../domain/entities/user';
const props = defineProps<{
    modelValue: boolean;
    user: User
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'handle-update-profile', localUser: User): void;
}>();

const localUser = ref<User | null>(null)

const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);

const isFormValid = computed(() => {
    if (!formRef.value) return false;
    return formRef.value.checkValidity();
});

const sexOptions = [
    { text: '男', value: '1' },
    { text: '女', value: '0' },
    { text: '其他', value: '2' }
];


const handleSaveProfile = () => {
    if (isFormValid.value) {
        if (localUser.value) {
            emit('handle-update-profile', localUser.value as User);

        }
        closeDialog();
    }
};

const closeDialog = () => {
    emit('update:modelValue', false);
};

// const formattedBirthday = computed(() => {
//     if (!userBasicInfo.birthday) return '';
//     const date = new Date(userBasicInfo.birthday);
//     console.log('formatter值变化', formattedBirthday.value);
//     return date.toLocaleDateString('zh-CN', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//     });
// });
// function onDateSelected(val: string) {
//     userBasicInfo.birthday = val;
//     dateMenu.value = false;
// }
// watch(() => userBasicInfo.birthday, (newVal) => {
//     if (newVal) {
//         console.log('生日变化:', newVal);
//         const date = new Date(newVal);
//         userBasicInfo.birthday = date.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
//     }
// });

watch(
    [() => props.user, () => props.modelValue],
    ([user, modelValue]) => {
        if (modelValue) {
            localUser.value = user ? user.clone() : User.forCreate();
        }
    }
)
</script>
