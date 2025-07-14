<template>
  <v-avatar :size="size" class="mb-4" color="primary">
                    <template v-if="avatarUrl">
                        <img :src="avatarUrl" alt="用户头像" />
                    </template>
                    <template v-else>
                        <span class="default-avatar-text">
                            {{ '?' }}
                        </span>
                    </template>
                </v-avatar>
</template>
<script setup lang="ts">
defineProps<{ avatarUrl?: string, size: string }>();
</script>