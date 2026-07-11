/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Typography scale ──────────────────────────────────────────
      fontSize: {
        '3xs':  ['0.5625rem', { lineHeight: '1.2' }],   // 9px  — mood badge
        '2xs':  ['0.625rem',  { lineHeight: '1.2' }],    // 10px — badge, tiny label
        'xs':   ['0.75rem',   { lineHeight: '1.25rem' }], // 12px — helper text
        'sm':   ['0.8125rem', { lineHeight: '1.375rem' }],// 13px — secondary text
        'base': ['0.875rem',  { lineHeight: '1.5rem' }],  // 14px — body
        'lg':   ['1rem',      { lineHeight: '1.5rem' }],   // 16px — body large
        'xl':   ['1.125rem',  { lineHeight: '1.75rem' }],  // 18px — subtitle
        '2xl':  ['1.25rem',   { lineHeight: '1.75rem' }],  // 20px — section title
        '3xl':  ['1.5rem',    { lineHeight: '2rem' }],     // 24px — panel title
        '4xl':  ['1.75rem',   { lineHeight: '2.25rem' }],  // 28px — page title
        '5xl':  ['2.25rem',   { lineHeight: '2.5rem' }],   // 36px — hero
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // ── Border radius system ──────────────────────────────────────
      borderRadius: {
        'none':   '0',
        'xs':     '0.25rem',   // 4px  — badge, tag
        'sm':     '0.375rem',  // 6px  — btn (daisyUI default)
        'DEFAULT':'0.375rem',
        'md':     '0.5rem',    // 8px  — card, input
        'lg':     '0.75rem',   // 12px — panel, modal
        'xl':     '1rem',      // 16px — large card
        'full':   '9999px',
      },

      // ── Spacing system (extends default 4px grid) ─────────────────
      spacing: {
        '0.5':  '0.125rem',  // 2px
        '4.5':  '1.125rem',  // 18px
        '13':   '3.25rem',   // 52px
        '15':   '3.75rem',   // 60px
        '18':   '4.5rem',    // 72px
      },

      // ── Box shadow system (layered elevation) ─────────────────────
      boxShadow: {
        'xs':    '0 1px 2px 0 oklch(0 0 0 / 0.03)',
        'sm':    '0 1px 3px 0 oklch(0 0 0 / 0.04), 0 1px 2px -1px oklch(0 0 0 / 0.03)',
        'DEFAULT':'0 1px 3px 0 oklch(0 0 0 / 0.06), 0 4px 12px 0 oklch(0 0 0 / 0.04)',
        'md':    '0 4px 16px 0 oklch(0 0 0 / 0.06), 0 2px 6px 0 oklch(0 0 0 / 0.04)',
        'lg':    '0 8px 28px 0 oklch(0 0 0 / 0.08), 0 4px 12px 0 oklch(0 0 0 / 0.05)',
        'xl':    '0 12px 40px 0 oklch(0 0 0 / 0.10), 0 4px 16px 0 oklch(0 0 0 / 0.06)',
        'inner': 'inset 0 2px 4px 0 oklch(0 0 0 / 0.04)',
      },

      // ── Transition durations ──────────────────────────────────────
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '350': '350ms',
      },

      // ── Z-index scale ─────────────────────────────────────────────
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '100': '100',
      },

      // ── Font families ─────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          'color-scheme': 'light',
          // ── Enhanced primary: deeper blue for WCAG AA contrast ──
          'primary':        'oklch(0.55 0.22 252)',
          'primary-content': 'oklch(0.98 0.005 260)',
          'secondary':      'oklch(0.58 0.06 260)',
          'secondary-content':'oklch(0.98 0.005 260)',
          'accent':         'oklch(0.65 0.16 180)',
          'accent-content': 'oklch(0.98 0.005 260)',
          'neutral':        'oklch(0.20 0.02 260)',
          'neutral-content': 'oklch(0.98 0.005 260)',
          'base-100':       'oklch(0.98 0.005 260)',
          'base-200':       'oklch(0.95 0.008 260)',
          'base-300':       'oklch(0.89 0.01 260)',
          'base-content':   'oklch(0.20 0.02 260)',
          // ── Enhanced semantic colors ──
          'info':           'oklch(0.68 0.19 240)',
          'info-content':   'oklch(0.98 0.005 260)',
          'success':        'oklch(0.55 0.19 148)',
          'success-content': 'oklch(0.98 0.005 260)',
          'warning':        'oklch(0.70 0.18 82)',
          'warning-content': 'oklch(0.20 0.02 260)',
          'error':          'oklch(0.50 0.24 22)',
          'error-content':  'oklch(0.98 0.005 260)',
          // ── Unified component tokens ──
          '--rounded-box':  '0.75rem',
          '--rounded-btn':  '0.375rem',
          '--rounded-badge': '0.25rem',
          '--animation-btn': '0.15s',
          '--animation-input': '0.15s',
          '--tab-radius':   '0.375rem',
        },
        dark: {
          'color-scheme': 'dark',
          'primary':        'oklch(0.70 0.18 250)',
          'primary-content': 'oklch(0.18 0.02 260)',
          'secondary':      'oklch(0.55 0.06 260)',
          'secondary-content':'oklch(0.95 0.008 260)',
          'accent':         'oklch(0.75 0.14 180)',
          'accent-content': 'oklch(0.18 0.02 260)',
          'neutral':        'oklch(0.90 0.005 260)',
          'neutral-content': 'oklch(0.18 0.02 260)',
          'base-100':       'oklch(0.18 0.02 260)',
          'base-200':       'oklch(0.22 0.03 260)',
          'base-300':       'oklch(0.28 0.04 260)',
          'base-content':   'oklch(0.88 0.01 260)',
          'info':           'oklch(0.72 0.18 240)',
          'info-content':   'oklch(0.18 0.02 260)',
          'success':        'oklch(0.68 0.16 150)',
          'success-content': 'oklch(0.18 0.02 260)',
          'warning':        'oklch(0.80 0.16 85)',
          'warning-content': 'oklch(0.18 0.02 260)',
          'error':          'oklch(0.58 0.20 25)',
          'error-content':  'oklch(0.95 0.008 260)',
          '--rounded-box':  '0.75rem',
          '--rounded-btn':  '0.375rem',
          '--rounded-badge': '0.25rem',
          '--animation-btn': '0.15s',
          '--animation-input': '0.15s',
          '--tab-radius':   '0.375rem',
        },
      },
    ],
  },
}
