module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@next/next/no-html-link-for-pages': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'prefer-const': 'warn',
    'react/no-unescaped-entities': 'warn'
  }
}