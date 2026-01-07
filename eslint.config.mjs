import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["dist/", "node_modules/", "coverage/", ".nyc_output/"],
  },
  tseslint.configs.recommended,
  prettier,
  {
    // Test files use Chai's expect().to.be.true style which triggers this rule
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  }
);
