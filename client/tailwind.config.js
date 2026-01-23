/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ink: "#0a0a0a",
                paper: "#fcfcfc",
                marker: "#ef4444",
                "sketch-border": "#1a1a1a",
            }
        },
    },
    plugins: [],
}
