import js from '@eslint/js';
import globals from 'globals';
export default [
  {ignores:['**/node_modules/**','**/.next/**','**/dist/**','**/.expo/**','**/private-media/**','playwright-report/**','test-results/**']},
  {files:['**/*.{js,jsx,mjs}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.node,...globals.browser,__DEV__:'readonly'}},rules:{...js.configs.recommended.rules,'no-unused-vars':'off','no-eval':'error','no-new-func':'error','no-implied-eval':'error'}},
  {files:['mobile/app.config.js'],languageOptions:{sourceType:'commonjs'}},
];
