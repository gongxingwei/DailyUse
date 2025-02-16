<template>
    <v-card>
        <v-card-text>
            <template v-if="todos.length > 0">
                <v-list>
                    <v-list-item v-for="todo in todos" :key="todo.id"
                        :class="{ 'text-decoration-line-through': todo.completed }">
                        <template v-slot:prepend>
                            <v-checkbox :model-value="todo.completed" @change="todoStore.toggleComplete(todo)"
                                hide-details></v-checkbox>
                        </template>
                        <v-list-item-title>{{ todo.title }}</v-list-item-title>
                        <template v-slot:append>
                            <v-btn icon="mdi-information" variant="text" size="small"
                                @click="showTodoInfo(todo.id)"></v-btn>
                            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editToDo(todo.id)"></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </template>
            <template v-else>
                <div class="text-center text-medium-emphasis py-4">
                    <v-icon size="large" color="grey-lighten-1">mdi-check-circle</v-icon>
                    <div class="text-body-2 mt-2">暂无待办事项</div>
                </div>
            </template>
        </v-card-text>
    </v-card>
    <EditToDoCard v-model="showEditDialog" :todo="operationTodo" @update:modelValue="showEditDialog = false" />
    <ShowToDoInfo v-model="showInfoDialog" :todo="operationTodo" @update:modelValue="showInfoDialog = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTodoStore } from '../todoStore';
import type { Todo } from '../todoStore'
import EditToDoCard from './EditToDoCard.vue';
import ShowToDoInfo from './ShowToDoInfo.vue';


interface Props {
    todos: Todo[]
}
const { todos } = defineProps<Props>()

const todoStore = useTodoStore();

const showEditDialog = ref(false);
const showInfoDialog = ref(false);

const operationTodo = ref<Todo | null>(null);

const editToDo = (id: number) => {
    let todo = todoStore.getTodoById(id);
    if (todo) {
        operationTodo.value = todo;
        showEditDialog.value = true;
    }
}

const showTodoInfo = (id: number) => {
    let todo = todoStore.getTodoById(id);
    if (todo) {
        operationTodo.value = todo;
        showInfoDialog.value = true;
    }
}
</script>