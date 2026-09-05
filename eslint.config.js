export default [
  {
    ignores: ["src/generated/**", "src/logs/**", "src/public/**"],
  },
  {
    files: ["src/**/*.js", "prisma/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Buffer: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        global: "readonly",
        process: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
    },
  },
];
