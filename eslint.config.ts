import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default tseslint.config([
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.nx/**",
      "**/dist-electron/**",
      "**/*.d.ts"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    
  },
  
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      "@typescript-eslint/no-unused-vars": "off"
    }
  },
]);