import { readFileSync } from "node:fs";
import { builtinModules, createRequire } from "node:module";
import { expect, test } from "vitest";

// 5.0.0 was published from a stale build that still loaded tiny-secp256k1
// (left over from a removed experiment) in dist/index.js and dist/index.cjs.
// It is not a dependency, so every clean install failed to load the package.
// Every bare import left in the published files must be a declared dependency.
const require = createRequire(import.meta.url);
const pkg = require("./package.json");
const declared = new Set(Object.keys(pkg.dependencies ?? {}));
const builtins = new Set(builtinModules);

function packageName(specifier) {
  const [scopeOrName, name] = specifier.split("/");
  return scopeOrName.startsWith("@") ? `${scopeOrName}/${name}` : scopeOrName;
}

function bareImports(source) {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".") && !specifier.startsWith("/")) specifiers.add(specifier);
    }
  }
  return [...specifiers];
}

test.each(["dist/index.js", "dist/index.cjs", "dist/browser.js"])(
  "%s only imports declared dependencies",
  (file) => {
    const undeclared = bareImports(readFileSync(file, "utf8"))
      .filter((specifier) => !specifier.startsWith("node:") && !builtins.has(specifier))
      .map(packageName)
      .filter((name) => !declared.has(name));
    expect(undeclared).toEqual([]);
  }
);
