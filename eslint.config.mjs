import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/", "node_modules/", "coverage/", ".nyc_output/"],
  },
  ...tseslint.configs.recommended,
  prettier,
];
