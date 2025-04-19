<template>
    <v-card class="repo-card" variant="outlined" :ripple="true" @click="navigateToRepo">
        <v-card-text class="pa-3">
            <div class="d-flex flex-column">
                <div class="text-subtitle-1 font-weight-medium text-truncate">
                    {{ repository.title }}
                </div>
                <div v-if="repository.description" class="text-body-2 text-medium-emphasis text-truncate mt-1">
                    {{ repository.description }}
                </div>
                <div class="text-caption text-grey mt-2" v-if="repository.lastVisitTime">
                    {{ t('common.14') }}: {{ formatDate(repository.lastVisitTime) }}
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { Repository } from '../stores/repositoryStore';
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/shared/utils/dateUtils'
const { t } = useI18n()

interface Props {
    repository: Repository
}
const { repository } = defineProps<Props>()
const router = useRouter()

const navigateToRepo = () => {
    router.push(`/repository/${repository.title}`)

}

</script>

<style scoped>
</style>