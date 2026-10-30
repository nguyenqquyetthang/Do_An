import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./frontend/src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1.25rem',
			screens: {
				'2xl': '1320px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['"Be Vietnam Pro"', '"Inter"', 'system-ui', 'sans-serif'],
				mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					text: 'hsl(var(--destructive-text))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				gold: {
					DEFAULT: 'hsl(var(--gold))',
					soft: 'hsl(var(--gold-soft))',
					deep: 'hsl(var(--gold-deep))'
				},
				verified: {
					DEFAULT: 'hsl(var(--verified))',
					text: 'hsl(var(--verified-text))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				ticket: {
					'available-bg': 'hsl(var(--state-available-bg))',
					'available-border': 'hsl(var(--state-available-border))',
					'available-fg': 'hsl(var(--state-available-fg))',
					'mine-bg': 'hsl(var(--state-mine-bg))',
					'mine-fg': 'hsl(var(--state-mine-fg))',
					'mine-ring': 'hsl(var(--state-mine-ring))',
					'other-bg': 'hsl(var(--state-other-bg))',
					'other-border': 'hsl(var(--state-other-border))',
					'other-fg': 'hsl(var(--state-other-fg))',
					'sold-bg': 'hsl(var(--state-sold-bg))',
					'sold-fg': 'hsl(var(--state-sold-fg))',
					'off-bg': 'hsl(var(--state-off-bg))',
					'off-border': 'hsl(var(--state-off-border))',
					'off-fg': 'hsl(var(--state-off-fg))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-gold': 'var(--gradient-gold)',
				'gradient-ink': 'var(--gradient-ink)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-verified': 'var(--gradient-verified)',
				'gradient-violet': 'var(--gradient-violet)',
				'gradient-panel': 'var(--gradient-panel)',
				'gradient-tech': 'var(--gradient-tech)',
				'gradient-vehicle': 'var(--gradient-vehicle)',
				'gradient-cash': 'var(--gradient-cash)',
				'gradient-travel': 'var(--gradient-travel)',
				'gradient-home': 'var(--gradient-home)',
				'gradient-other': 'var(--gradient-other)'
			},
			boxShadow: {
				e1: 'var(--shadow-e1)',
				e2: 'var(--shadow-e2)',
				e3: 'var(--shadow-e3)',
				'glow-gold': 'var(--shadow-glow-gold)',
				'glow-verified': 'var(--shadow-glow-verified)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'calc(var(--radius) + 6px)',
				cell: '10px'
			},
			transitionTimingFunction: {
				standard: 'cubic-bezier(0.2, 0, 0, 1)',
				expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
				spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'sweep': {
					from: { transform: 'translateX(-110%)' },
					to: { transform: 'translateX(110%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'sweep': 'sweep 1.6s cubic-bezier(0.16, 1, 0.3, 1)'
			}
		}
	},
	plugins: [tailwindcssAnimate],
};

