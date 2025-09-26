<template>
    <v-dialog :model-value="visible" max-width="600" persistent>
        <v-card>
            <v-card-title class="pa-4">
                <v-icon size="24" class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-bell-plus' }}</v-icon>
                {{ isEditing ? '编辑提醒模板' : '创建提醒模板' }}
            </v-card-title>

            <v-form ref="formRef">
                <v-card-text class="pa-4">
                    <!-- 模板名称 -->
                    <v-text-field v-model="name" label="模板名称" variant="outlined" density="compact" :rules="nameRules"
                        class="mb-3" @keyup.enter="handleSave" />

                    <!-- 提醒消息 -->
                    <v-text-field v-model="message" label="提醒消息" variant="outlined" density="compact"
                        :rules="messageRules" class="mb-3" @keyup.enter="handleSave" />

                    <!-- 描述 -->
                    <v-textarea v-model="description" label="描述" variant="outlined" density="compact" rows="2"
                        class="mb-3" />

                    <!-- 分类 -->
                    <v-text-field v-model="category" label="分类" variant="outlined" density="compact" class="mb-3" />

                    <!-- 优先级 -->
                    <v-select v-model="priority" :items="priorityOptions" label="优先级" variant="outlined"
                        density="compact" item-title="title" item-value="value" class="mb-3" />

                    <!-- 图标选择 -->
                    <v-select v-model="icon" :items="iconOptions" label="选择图标" variant="outlined" density="compact"
                        item-title="text" item-value="value" class="mb-3">
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props">
                                <template v-slot:prepend>
                                    <v-icon>{{ item.raw.value }}</v-icon>
                                </template>
                            </v-list-item>
                        </template>
                    </v-select>

                    <!-- 启用开关 -->
                    <v-switch v-model="enabled" label="启用模板" color="primary" class="mb-3" />

                    <!-- 自我启用开关 (当分组为individual模式时显示) -->
                    <v-switch v-model="selfEnabled" label="自我启用" color="secondary" class="mb-3" />

                    <!-- 时间配置区域 -->
                    <v-card variant="outlined" class="mb-3">
                        <v-card-title class="pa-3 text-h6">时间配置</v-card-title>
                        <v-card-text class="pa-3">
                            <!-- 重复类型选择 -->
                            <v-select v-model="timeConfigType" :items="timeConfigOptions" label="重复类型"
                                variant="outlined" density="compact" item-title="title" item-value="value"
                                class="mb-3" />

                            <!-- 时间选择 -->
                            <div class="mb-3">
                                <v-text-field v-for="(time, index) in timeConfigTimes" :key="index"
                                    v-model="timeConfigTimes[index]" :label="`时间 ${index + 1}`" type="time"
                                    variant="outlined" density="compact" class="mb-2">
                                    <template v-slot:append>
                                        <v-btn v-if="timeConfigTimes.length > 1" icon size="small"
                                            @click="removeTime(index)">
                                            <v-icon>mdi-minus</v-icon>
                                        </v-btn>
                                    </template>
                                </v-text-field>

                                <v-btn v-if="timeConfigTimes.length < 5" size="small" prepend-icon="mdi-plus"
                                    variant="outlined" @click="addTime">
                                    添加时间
                                </v-btn>
                            </div>

                            <!-- 每周重复选项 -->
                            <div v-if="timeConfigType === 'weekly'" class="mb-3">
                                <v-label class="mb-2">选择星期几</v-label>
                                <v-chip-group v-model="weekdays" multiple color="primary">
                                    <v-chip v-for="(day, index) in weekdayOptions" :key="index" :value="index" filter
                                        variant="outlined">
                                        {{ day }}
                                    </v-chip>
                                </v-chip-group>
                            </div>

                            <!-- 每月重复选项 -->
                            <div v-if="timeConfigType === 'monthly'" class="mb-3">
                                <v-label class="mb-2">选择日期</v-label>
                                <v-chip-group v-model="monthDays" multiple color="primary">
                                    <v-chip v-for="day in 31" :key="day" :value="day" filter variant="outlined">
                                        {{ day }}日
                                    </v-chip>
                                </v-chip-group>
                            </div>

                            <!-- 自定义间隔选项 -->
                            <div v-if="timeConfigType === 'custom'" class="mb-3">
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field v-model.number="customInterval" label="间隔时间" type="number"
                                            variant="outlined" density="compact" min="1" />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-select v-model="customUnit" :items="customUnitOptions" label="时间单位"
                                            variant="outlined" density="compact" item-title="title"
                                            item-value="value" />
                                    </v-col>
                                </v-row>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-card-text>
            </v-form>

            <v-card-actions class="pa-4">
                <v-btn variant="text" @click="handleCancel">取消</v-btn>
                <v-btn color="primary" class="ml-2" @click="handleSave" variant="elevated" :disabled="!isFormValid">
                    确定
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { ReminderTemplate } from '@dailyuse/domain-client';
import { ReminderContracts } from '@dailyuse/contracts';
// composables
import { useReminder } from '../../composables/useReminder';

const { createTemplate, updateTemplate } = useReminder();

const visible = ref(false);
const propReminderTemplate = ref<ReminderTemplate | null>(null);
const localReminderTemplate = ref<ReminderTemplate>(ReminderTemplate.forCreate());

const isEditing = computed(() => !!propReminderTemplate.value);
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const isFormValid = computed(() => {
    return formRef.value?.isValid ?? false;
});

const name = computed({
    get: () => localReminderTemplate.value.name,
    set: (val: string) => {
        localReminderTemplate.value.updateBasicInfo({ name: val });
    }
});

const message = computed({
    get: () => localReminderTemplate.value.message,
    set: (val: string) => {
        localReminderTemplate.value.updateBasicInfo({ message: val });
    }
});

const description = computed({
    get: () => localReminderTemplate.value.description || '',
    set: (val: string) => {
        localReminderTemplate.value.updateBasicInfo({ description: val });
    }
});

const category = computed({
    get: () => localReminderTemplate.value.category || '',
    set: (val: string) => {
        localReminderTemplate.value.updateBasicInfo({ category: val });
    }
});

const icon = computed({
    get: () => localReminderTemplate.value.icon || '',
    set: (val: string) => {
        localReminderTemplate.value.updateBasicInfo({ icon: val });
    }
});

const enabled = computed({
    get: () => localReminderTemplate.value.enabled,
    set: (val: boolean) => {
        localReminderTemplate.value.toggleEnabled(val);
    }
});

const selfEnabled = computed({
    get: () => localReminderTemplate.value.selfEnabled,
    set: (val: boolean) => {
        localReminderTemplate.value.toggleSelfEnabled(val);
    }
});

// Priority 需要特殊处理，因为 updateBasicInfo 不支持 priority
// 我们使用临时的响应式变量来处理
const priority = ref<ReminderContracts.ReminderPriority>(ReminderContracts.ReminderPriority.NORMAL);

// 时间配置相关状态
const timeConfigType = ref<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
const timeConfigTimes = ref<string[]>(['09:00']);
const weekdays = ref<number[]>([]);
const monthDays = ref<number[]>([]);
const customInterval = ref<number>(1);
const customUnit = ref<'minutes' | 'hours' | 'days'>('hours');

const iconOptions = [
    { text: '提醒', value: 'mdi-bell' },
    { text: '工作', value: 'mdi-briefcase' },
    { text: '学习', value: 'mdi-school' },
    { text: '生活', value: 'mdi-home' },
    { text: '健康', value: 'mdi-heart' },
    { text: '时间', value: 'mdi-clock' },
];

const priorityOptions = [
    { title: '低', value: ReminderContracts.ReminderPriority.LOW },
    { title: '普通', value: ReminderContracts.ReminderPriority.NORMAL },
    { title: '高', value: ReminderContracts.ReminderPriority.HIGH },
    { title: '紧急', value: ReminderContracts.ReminderPriority.URGENT }
];

const timeConfigOptions = [
    { title: '每天', value: 'daily' },
    { title: '每周', value: 'weekly' },
    { title: '每月', value: 'monthly' },
    { title: '自定义', value: 'custom' }
];

const weekdayOptions = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const customUnitOptions = [
    { title: '分钟', value: 'minutes' },
    { title: '小时', value: 'hours' },
    { title: '天', value: 'days' }
];

const nameRules = [
    (v: string) => !!v || '名称不能为空',
    (v: string) => (v && v.length >= 1) || '名称至少需要1个字符',
    (v: string) => (v && v.length <= 50) || '名称不能超过50个字符'
];

const messageRules = [
    (v: string) => !!v || '提醒消息不能为空',
    (v: string) => (v && v.length <= 200) || '消息不能超过200个字符'
];

// 时间配置管理方法
const addTime = () => {
    if (timeConfigTimes.value.length < 5) {
        timeConfigTimes.value.push('09:00');
    }
};

const removeTime = (index: number) => {
    if (timeConfigTimes.value.length > 1) {
        timeConfigTimes.value.splice(index, 1);
    }
};

// 构建时间配置对象
const buildTimeConfig = () => {
    const baseConfig = {
        type: timeConfigType.value,
        times: timeConfigTimes.value,
    } as any;

    if (timeConfigType.value === 'weekly' && weekdays.value.length > 0) {
        baseConfig.weekdays = weekdays.value;
    }

    if (timeConfigType.value === 'monthly' && monthDays.value.length > 0) {
        baseConfig.monthDays = monthDays.value;
    }

    if (timeConfigType.value === 'custom') {
        baseConfig.customPattern = {
            interval: customInterval.value,
            unit: customUnit.value,
        };
    }

    return baseConfig;
};

const handleSave = async () => {
    if (!isFormValid.value) return;

    try {
        const timeConfig = buildTimeConfig();

        if (propReminderTemplate.value) {
            // 编辑模式
            await updateTemplate(localReminderTemplate.value.uuid, {
                name: localReminderTemplate.value.name,
                description: localReminderTemplate.value.description,
                message: localReminderTemplate.value.message,
                category: localReminderTemplate.value.category,
                priority: priority.value as any,
                enabled: localReminderTemplate.value.enabled,
                selfEnabled: localReminderTemplate.value.selfEnabled,
                timeConfig,
            });
        } else {
            // 创建模式
            await createTemplate({
                name: localReminderTemplate.value.name,
                description: localReminderTemplate.value.description || '',
                message: localReminderTemplate.value.message,
                category: localReminderTemplate.value.category || '',
                priority: priority.value as any,
                tags: [],
                enabled: localReminderTemplate.value.enabled,
                selfEnabled: localReminderTemplate.value.selfEnabled,
                timeConfig,
            });
        }
        closeDialog();
    } catch (error) {
        console.error('保存提醒模板失败:', error);
    }
};

const handleCancel = () => {
    closeDialog();
};

const openDialog = (reminderTemplate?: ReminderTemplate) => {
    visible.value = true;
    propReminderTemplate.value = reminderTemplate || null;
};

const openForCreate = () => {
    openDialog();
};

const openForEdit = (reminderTemplate: ReminderTemplate) => {
    openDialog(reminderTemplate);
};

const closeDialog = () => {
    visible.value = false;
};

// 初始化时间配置数据
const initTimeConfig = (template?: ReminderTemplate) => {
    if (template && template.timeConfig) {
        const config = template.timeConfig;
        timeConfigType.value = config.type as any;
        timeConfigTimes.value = config.times && config.times.length > 0 ? [...config.times] : ['09:00'];
        weekdays.value = config.weekdays ? [...config.weekdays] : [];
        monthDays.value = config.monthDays ? [...config.monthDays] : [];

        if (config.customPattern) {
            customInterval.value = config.customPattern.interval || 1;
            customUnit.value = config.customPattern.unit || 'hours';
        } else {
            customInterval.value = 1;
            customUnit.value = 'hours';
        }
    } else {
        // 重置为默认值
        timeConfigType.value = 'daily';
        timeConfigTimes.value = ['09:00'];
        weekdays.value = [];
        monthDays.value = [];
        customInterval.value = 1;
        customUnit.value = 'hours';
    }
};

watch(
    [() => visible.value, () => propReminderTemplate.value],
    ([show]) => {
        if (show) {
            localReminderTemplate.value = propReminderTemplate.value ? propReminderTemplate.value.clone() : ReminderTemplate.forCreate();
            priority.value = localReminderTemplate.value.priority;
            initTimeConfig(propReminderTemplate.value || undefined);
        } else {
            localReminderTemplate.value = ReminderTemplate.forCreate();
            priority.value = ReminderContracts.ReminderPriority.NORMAL;
            initTimeConfig();
        }
    },
    { immediate: true }
);

defineExpose({
    openForCreate,
    openForEdit,
});
</script>