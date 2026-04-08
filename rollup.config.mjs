import { createRequire } from "node:module";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");
const scureBasePath = require.resolve("@scure/base/index.js");

const externalDeps = new Set(Object.keys(pkg.dependencies ?? {}));

const extensions = [".js", ".json"];

const tsPlugin = typescript({
  tsconfig: "./tsconfig.json",
  declaration: false,
  declarationMap: false,
});

const basePlugins = [
  {
    name: "fix-scure-base-resolution",
    resolveId(source) {
      if (source === "@scure/base") {
        return scureBasePath;
      }
      return null;
    },
  },
  nodeResolve({ extensions }),
  json(),
  commonjs(),
  tsPlugin,
];

const external = (id) => {
  if (id.startsWith("node:")) {
    return true;
  }

  const [scopeOrName, maybeName] = id.split("/");
  const packageName = scopeOrName.startsWith("@") ? `${scopeOrName}/${maybeName}` : scopeOrName;
  return externalDeps.has(packageName);
};

export default [
  {
    input: "./src/index.ts",
    external,
    plugins: basePlugins,
    output: {
      file: "./dist/index.js",
      format: "esm",
      sourcemap: true,
    },
  },
  {
    input: "./src/node.ts",
    plugins: basePlugins,
    output: {
      file: "./dist/index.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  },
  {
    input: "./src/browser.ts",
    plugins: [
      {
        name: "fix-scure-base-resolution",
        resolveId(source) {
          if (source === "@scure/base") {
            return scureBasePath;
          }
          return null;
        },
      },
      nodeResolve({ browser: true, extensions }),
      json(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false,
      }),
    ],
    output: {
      file: "./dist/browser.js",
      format: "esm",
      sourcemap: true,
    },
  },
  {
    input: "./src/global.ts",
    plugins: [
      {
        name: "fix-scure-base-resolution",
        resolveId(source) {
          if (source === "@scure/base") {
            return scureBasePath;
          }
          return null;
        },
      },
      nodeResolve({ browser: true, extensions }),
      json(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false,
      }),
    ],
    output: {
      file: "./dist/NeuraiKey.global.js",
      format: "iife",
      name: "NeuraiKeyBundle",
      sourcemap: true,
    },
  },
  {
    input: "./src/index.ts",
    plugins: [dts()],
    output: {
      file: "./dist/index.d.ts",
      format: "esm",
    },
  },
];
