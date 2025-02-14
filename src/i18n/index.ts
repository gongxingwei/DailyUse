import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN/index'
import enUS from './locales/en-US/index'
import settings from './locales/en-US/settings'
import { useSettingStore } from '../modules/Setting/settingStore'

export const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages: {
        'zh-CN': zhCN,
        'en-US': enUS
    }
})

export function setLanguage(locale: 'en-US' | 'zh-CN') {
    i18n.global.locale.value = locale
}

export function initializeLanguage() {
    const language = useSettingStore().language
    setLanguage(language)
}

export default {
    settings
}