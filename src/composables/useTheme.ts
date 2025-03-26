import { ref, watchEffect } from 'vue';

export function useTheme() {
    const isDarkMode = ref(false);

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            isDarkMode.value = savedTheme === 'dark';
        }
        applyTheme();
    };

    const applyTheme = () => {
        const theme = isDarkMode.value ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);

        const bgColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--background')
            .trim();

        if (bgColor) {
            document.body.style.backgroundColor = bgColor;
        }
    };

    const toggleTheme = () => {
        isDarkMode.value = !isDarkMode.value;
        localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
    };

    watchEffect(applyTheme);
    initTheme();

    return {
        isDarkMode,
        toggleTheme
    };
}