import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    fontFamily: {
      sans: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        "sans-serif",
      ],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        faredown: {
          blue: "hsl(var(--faredown-blue))",
          "blue-secondary": "hsl(var(--faredown-blue-secondary))",
          orange: "hsl(var(--faredown-orange))",
          "orange-hover": "hsl(var(--faredown-orange-hover))",
          "orange-active": "hsl(var(--faredown-orange-active))",
          green: "hsl(var(--faredown-green))",
          red: "hsl(var(--faredown-red))",
          gray: "hsl(var(--faredown-gray))",
          light: "hsl(var(--faredown-light))",
        },
        price: {
          up: "hsl(var(--price-up))",
          down: "hsl(var(--price-down))",
          neutral: "hsl(var(--price-neutral))",
        },
        booking: {
          primary: "hsl(var(--faredown-blue))",
          secondary: "hsl(var(--faredown-blue-secondary))",
          yellow: "hsl(var(--faredown-orange))",
          "yellow-hover": "hsl(var(--faredown-orange-hover))",
          "yellow-active": "hsl(var(--faredown-orange-active))",
          "light-gray": "#f2f2f2",
          "accent-blue": "#e7f0fa",
          "text-gray": "#6b6b6b",
          white: "#ffffff",
          black: "#000000",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        h1: [
          "3rem",
          { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.025em" },
        ], // text-5xl md:text-6xl font-bold tracking-tight
        "h1-md": [
          "3.75rem",
          { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.025em" },
        ],
        h2: ["1.875rem", { lineHeight: "1.2", fontWeight: "600" }], // text-3xl md:text-4xl font-semibold
        "h2-md": ["2.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }], // text-2xl font-semibold
        body: ["15px", { lineHeight: "1.75" }], // text-[15px] md:text-base leading-7
        "body-md": ["16px", { lineHeight: "1.75" }],
        small: ["13px", { lineHeight: "1.4" }], // text-[13px]
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(4px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 150ms ease-out",
      },
      transitionDuration: {
        "150": "150ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
