/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  semi: true,
  singleQuote: true,
  useTabs: false,
  arrowParens: 'always',
  bracketSameLine: false,
  endOfLine: 'lf',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  experimentalTernaries: false,
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxSingleQuote: false,
  singleAttributePerLine: true,
  tabWidth: 2,
};

export default config;
