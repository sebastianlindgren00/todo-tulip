/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B892FF',
        primaryVariant: '#6E44FF',
        secondary: '#FF90B3',
        contrasting: '#6E44FF',
        textDark: '#333333',
        textLight: '#EEEEEE',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ]
}

