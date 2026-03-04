#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";

const locales = ["ru", "en"];
const baseLocale = "ru";
const localesDir = path.join(process.cwd(), "src", "locales");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function getAllKeys(obj, prefix = "") {
  let keys = [];

  for (const key in obj) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
      continue;
    }

    keys.push(fullKey);
  }

  return keys;
}

const localeData = {};
let hasErrors = false;

for (const locale of locales) {
  const filePath = path.join(localesDir, `${locale}.json`);

  try {
    localeData[locale] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(
      `${colors.red}✗ Failed to read ${locale}.json: ${error.message}${colors.reset}`,
    );
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

const baseKeys = new Set(getAllKeys(localeData[baseLocale]));

console.log(`\n${colors.bold}Checking locale key consistency...${colors.reset}`);

for (const locale of locales) {
  if (locale === baseLocale) continue;

  const currentKeys = new Set(getAllKeys(localeData[locale]));
  const missing = [...baseKeys].filter((key) => !currentKeys.has(key));
  const extra = [...currentKeys].filter((key) => !baseKeys.has(key));

  if (missing.length > 0) {
    hasErrors = true;
    console.error(`${colors.red}✗ Missing keys in ${locale}.json:${colors.reset}`);
    missing.forEach((key) => console.error(`  - ${key}`));
  }

  if (extra.length > 0) {
    console.warn(`${colors.yellow}⚠ Extra keys in ${locale}.json:${colors.reset}`);
    extra.forEach((key) => console.warn(`  - ${key}`));
  }
}

if (hasErrors) {
  console.error(`\n${colors.red}${colors.bold}✗ i18n validation failed${colors.reset}\n`);
  process.exit(1);
}

console.log(`${colors.green}✓ Locale keys are consistent${colors.reset}`);
console.log(`\n${colors.green}${colors.bold}✓ i18n validation passed${colors.reset}\n`);
