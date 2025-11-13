// tailwind.config.js
export default {
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx,js,jsx}"
    ],
    theme: {
        extend: {},
    },
    corePlugins: {
        preflight: false, // evita conflictos con MUI CssBaseline
    },
    plugins: [],
};
