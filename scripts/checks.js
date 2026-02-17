#!/usr/bin/env bun

const { execSync } = require("child_process");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

const checks = [
  { name: "Lint", command: "bun lint" },
  { name: "TypeCheck", command: "bun typecheck" },
  { name: "Build", command: "bun run build" },
];

let allPassed = true;

console.log("\n" + colors.bold + "Running checks...\n" + colors.reset);

checks.forEach((check) => {
  try {
    execSync(check.command, { stdio: "pipe" });
    console.log(
      `${check.name}: ${colors.green}${colors.bold}PASSED${colors.reset}`
    );
  } catch (error) {
    console.log(
      `${check.name}: ${colors.red}${colors.bold}FAILED${colors.reset}`
    );
    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    allPassed = false;
  }
});

console.log("");

if (allPassed) {
  console.log(
    colors.green + colors.bold + "All checks passed!" + colors.reset + "\n"
  );
  process.exit(0);
} else {
  console.log(
    colors.red + colors.bold + "Some checks failed!" + colors.reset + "\n"
  );
  process.exit(1);
}
