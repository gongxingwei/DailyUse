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
import type { Repository } from '../repositoryStore';
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
    repository: Repository
}
const { repository } = defineProps<Props>()
const router = useRouter()

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return ''

    try {
        return new Date(dateStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        console.error('Invalid date:', dateStr)
        return ''
    }
}

const navigateToRepo = () => {
    router.push(`/repository/${repository.title}`)

}

</script>

<style scoped>
.repo-card {
    width: 250px;
    cursor: pointer;
    transition: transform 0.2s;
}

.repo-card:hover {
    transform: translateY(-2px);
}

.text-truncate {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>