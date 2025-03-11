/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				'hey-orange': '#EE7800',
				gray: '#626262',
				'gray-dark': '#4a4a4a'
			},
		},
	},
	plugins: [],
};
