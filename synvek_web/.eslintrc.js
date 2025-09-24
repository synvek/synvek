module.exports = {
  extends: [require.resolve('@umijs/max/eslint'), 'plugin:prettier/recommended'],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
}
