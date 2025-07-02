import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

// 获取浏览器语言偏好
function getDefaultLocale() {
  // 先从 localStorage 获取
  const stored = localStorage.getItem('kaito-locale')
  if (stored) {
    return stored
  }

  // 从浏览器语言获取
  const browserLocale = navigator.language || (navigator as any).userLanguage
  const lang = browserLocale.split('-')[0]

  // 确保返回支持的语言
  return ['en', 'zh'].includes(lang) ? lang : 'en'
}

const messages = {
  en,
  zh,
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages,
})

// 切换语言的辅助函数
export function setLocale(locale: string) {
  i18n.global.locale.value = locale
  localStorage.setItem('kaito-locale', locale)
}

export function getCurrentLocale() {
  return i18n.global.locale.value
}

export default i18n
