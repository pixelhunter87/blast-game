import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";

const compat = new FlatCompat({ baseDirectory: import.meta.url, recommendedConfig: js.configs.recommended, allConfig: js.configs.all });

export default defineConfig([
	{
		extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:de-morgan/recommended-legacy"),
		plugins: { "@typescript-eslint": typescriptEslint, unicorn, sonarjs, "@stylistic": stylistic },
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: { project: "./tsconfig.json" },
		},
		rules: {
			"one-var-declaration-per-line": ["error", "always"],
			"object-shorthand": "error",
			"default-param-last": "error",
			"prefer-template": "error",
			"@typescript-eslint/no-unnecessary-template-expression": "error",
			"prefer-object-spread": "error",
			"prefer-rest-params": "error",
			"no-new-wrappers": "error",
			"no-else-return": "error",
			"no-lonely-if": "error",
			"no-var": "error",
			"no-new-object": "error",
			"no-array-constructor": "error",
			"no-useless-escape": "error",
			"no-iterator": "error",
			"no-prototype-builtins": "error",
			"no-void": "error",
			"@stylistic/implicit-arrow-linebreak": ["error", "beside"],
			"func-style": ["error", "expression", { allowArrowFunctions: true }],
			"no-restricted-imports": ["error", {
				patterns: [
					{ group: ["../*", "..", ".", "!src/*"], message: "Relative imports not allowed" },
				],
			}],
			"no-restricted-syntax": [
				"error",
				{ selector: "ForInStatement", message: "for...in loops are not allowed, use Object.getKeys(), Object.values() or Object.entries() with array.forEach() instead" },
				{ selector: "MethodDefinition[kind='set']", message: "Property setters are not allowed" },
				{ selector: "MethodDefinition[kind='get']", message: "Property getters are not allowed" },
				{ selector: "ImportExpression", message: "Use static imports instead of dynamic imports." },
			],
			"no-restricted-globals": "off",
			"no-restricted-properties": [
				"error",
				{ object: "Object", property: "hasOwnProperty", message: "Используйте Object.hasOwn() вместо Object.hasOwnProperty()." },
				{ property: "hasOwnProperty", message: "Используйте Object.hasOwn() вместо .hasOwnProperty()." },
			],
			"no-useless-assignment": "off",
			"@typescript-eslint/no-unsafe-enum-comparison": "error",
			"@typescript-eslint/no-this-alias": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
			"@typescript-eslint/no-array-constructor": "off",
			"@typescript-eslint/naming-convention": [
				"error",
				{ selector: ["variable", "classProperty"], format: ["camelCase", "UPPER_CASE"], leadingUnderscore: "forbid", trailingUnderscore: "forbid" },
				{ selector: ["function", "classMethod"], format: ["camelCase"], leadingUnderscore: "forbid", trailingUnderscore: "forbid" },
				{ selector: ["parameter"], format: ["camelCase"], filter: { regex: "^_", match: false } },
				{ selector: ["typeLike", "class"], format: ["PascalCase"], leadingUnderscore: "forbid", trailingUnderscore: "forbid" },
				{ selector: ["enumMember", "enum"], format: ["PascalCase"], custom: { regex: "[A-Z]{4}", match: false }, leadingUnderscore: "forbid", trailingUnderscore: "forbid" },
			],
			"@typescript-eslint/array-type": ["error", { default: "array" }],
			"@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
			"@typescript-eslint/no-confusing-non-null-assertion": "error",
			"@typescript-eslint/no-unsafe-unary-minus": "error",
			"@typescript-eslint/prefer-find": "error",
			"@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public", overrides: { parameterProperties: "explicit" } }],
			"@typescript-eslint/member-ordering": ["error", { classes: ["public-static-field", "private-static-field", "public-static-method", "private-static-method", "public-field", "private-field", "constructor", "public-method", "private-method"] }],
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-unsafe-function-type": "off",
			"@typescript-eslint/await-thenable": "error",
			"@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
			"@stylistic/member-delimiter-style": "error",
			"unicorn/no-null": "error",
			"unicorn/no-useless-spread": "error",
			"unicorn/no-useless-length-check": "error",
			"unicorn/prefer-negative-index": "error",
			"unicorn/prefer-spread": "error",
			"unicorn/prefer-string-replace-all": "error",
			"unicorn/template-indent": "error",
			"sonarjs/no-all-duplicated-branches": "error",
			"sonarjs/no-identical-conditions": "error",
			"sonarjs/no-identical-expressions": "error",
			"sonarjs/no-ignored-return": "error",
			"sonarjs/no-collapsible-if": "error",
			"sonarjs/no-collection-size-mischeck": "error",
			"sonarjs/no-duplicated-branches": "error",
			"sonarjs/no-gratuitous-expressions": "error",
			"sonarjs/no-inverted-boolean-check": "error",
			"sonarjs/no-redundant-boolean": "error",
			"sonarjs/no-same-line-conditional": "error",
		},
	},
	{
		files: ["scripts/*", "vite.config.ts"],
		rules: {
			"no-restricted-imports": "off",
			"no-restricted-globals": "off",
			"no-restricted-syntax": ["off", { selector: "ImportExpression", message: "Use static imports instead of dynamic imports." }],
		},
	},
]);
