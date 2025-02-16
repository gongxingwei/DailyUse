<template>
    <v-dialog v-model="dialogVisible" max-width="900px">
        <v-card>
            <v-card-title class="text-h5 pa-4">
                {{ t('goal.11') }} - {{ goal?.name }}
            </v-card-title>
            <v-card-text>
                <v-row>
                    <!-- 左侧：可选择的Todo列表 -->
                    <v-col cols="6">
                        <div class="text-subtitle-1 mb-3">{{ t('common.21') }}</div>
                        <v-list density="compact" border>
                            <v-list-item 
                                v-for="todo in availableTodos" 
                                :key="todo.id" 
                                :title="todo.title"
                                @click="addTodo(todo)" 
                                class="cursor-pointer"
                            >
                                <template v-slot:prepend>
                                    <v-icon color="primary">mdi-checkbox-blank-circle-outline</v-icon>
                                </template>
                                <template v-slot:append>
                                    <v-icon color="success">mdi-plus</v-icon>
                                </template>
                            </v-list-item>
                            <v-list-item v-if="availableTodos.length === 0" density="compact">
                                <v-list-item-title class="text-medium-emphasis">
                                    {{ t('common.10') }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-col>

                    <!-- 右侧：已关联Todo列表 -->
                    <v-col cols="6">
                        <div class="text-subtitle-1 mb-3">{{ t('common.22') }}</div>
                        <v-list density="compact" border>
                            <v-list-item 
                                v-for="todo in relatedTodos" 
                                :key="todo.id" 
                                :title="todo.title"
                                @click="removeTodo(todo)" 
                                class="cursor-pointer"
                            >
                                <template v-slot:prepend>
                                    <v-icon color="success">mdi-checkbox-marked-circle</v-icon>
                                </template>
                                <template v-slot:append>
                                    <v-icon color="error">mdi-minus</v-icon>
                                </template>
                            </v-list-item>
                            <v-list-item v-if="relatedTodos.length === 0" density="compact">
                                <v-list-item-title class="text-medium-emphasis">
                                    {{ t('common.10') }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="$emit('update:modelValue', false)">
                    {{ t('common.1') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTodoStore } from '@/modules/Todo/todoStore'
import { useGoalStore } from '../goalStore'
import { useI18n } from 'vue-i18n'
import type { Todo } from '@/modules/Todo/todoStore'

const { t } = useI18n()
const todoStore = useTodoStore()
const goalStore = useGoalStore()

interface Props {
    modelValue: boolean
    goalId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const goal = computed(() =>goalStore.getGoalById(props.goalId));

// 获取所有可选择的Todo（排除已关联的）
const availableTodos = computed(() => {
    return todoStore.todos.filter(todo => !goal.value?.relativeTodos?.some(t => t.id === todo.id))
})

// 获取已关联的Todo
const relatedTodos = computed(() => {
    return goal.value?.relativeTodos || []
})

// 添加关联Todo
const addTodo = (todo: Todo) => {
    goalStore.addTodoToGoal(props.goalId, todo)
}

// 移除关联Todo
const removeTodo = (todo: Todo) => {
    goalStore.removeTodoFromGoal(props.goalId, todo.id)
}
</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.cursor-pointer:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>