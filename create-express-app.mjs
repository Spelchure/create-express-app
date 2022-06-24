#!/usr/bin/node
import { program } from "commander";
import path from "path";
import colors from "colors";
import fs from "fs";
import shelljs from "shelljs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function keyPress(value) {
  return new Promise((resolve, reject) => {
    let withKeyCodes = value.map((item) => item.charCodeAt(0));
    process.stdin.setRawMode(true);
    process.stdin.once("data", (keystroke) => {
      process.stdin.setRawMode(false);
      if (withKeyCodes.indexOf(keystroke[0]) >= 0) resolve();
      return reject();
    });
  });
}

const packagesToInstall = {
  save: ["express", "dotenv", "helmet"],
  dev: [
    "@types/chai",
    "@types/cors",
    "@types/deep-equal-in-any-order",
    "@types/express",
    "@types/mocha",
    "@types/node",
    "@types/sinon",
    "@types/supertest",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "axios",
    "chai",
    "cors",
    "deep-equal-in-any-order",
    "eslint",
    "eslint-config-prettier",
    "eslint-plugin-tsdoc",
    "mocha",
    "nodemon",
    "sinon",
    "supertest",
    "ts-node",
    "tsconfig-paths",
    "typescript",
    "nyc",
  ],
};

const directoriesToCreate = [
  "src",
  "tests",
  path.join("src", "controllers"),
  path.join("src", "constants"),
  path.join("src", "models"),
  path.join("src", "views"),
  path.join("src", "utils"),
  path.join("src", "routes"),
  path.join("src", "types"),
  path.join("src", "middleware"),
  path.join("src", "services"),
  path.join("tests", "controllers"),
];

program
  .name("create-express-app")
  .description("Creates node typescript express application")
  .version("1.0.0");

program
  .argument("<project_name>", "Project name to create")
  .option("-p, --with-pipelines", "Add dummy pipeline files to project.", false)
  .option(
    "-d, --with-docker",
    "Add dummy Dockerfile and docker-compose for node image.",
    false
  )
  .option("-l, --with-winston", "Add winston logger to project.", false)
  .option(
    "-e, --extra-packages <packages...>",
    `Extra packages to install. 
(space seperated, add double colon dev as suffix for installing as a development 
dependency. For example: cors::dev`
  );

program.parse();

let appName = program.args[0];
let programOptions = program.opts();
let appDirectory = path.join(process.cwd(), appName);

const templateFiles = [
  { name: "editorconfig", dst: path.join(appDirectory, ".editorconfig") },
  { name: "env.development", dst: path.join(appDirectory, ".env.development") },
  { name: "env.development", dst: path.join(appDirectory, ".env.production") },
  { name: "eslintignore", dst: path.join(appDirectory, ".eslintignore") },
  { name: "eslintrc.json", dst: path.join(appDirectory, ".eslintrc.json") },
  { name: "gitignore", dst: path.join(appDirectory, ".gitignore") },
  { name: "prettierrc", dst: path.join(appDirectory, ".prettierrc") },
  { name: "tsconfig.json", dst: path.join(appDirectory, "tsconfig.json") },
  { name: "app.ts", dst: path.join(appDirectory, "src", "app.ts") },
  { name: "server.ts", dst: path.join(appDirectory, "src", "server.ts") },
  {
    name: "coverage-results",
    dst: path.join(appDirectory, "coverage-results.mjs"),
  },
  { name: "", dst: path.join(appDirectory, "README.md") },
  { name: "", dst: path.join(appDirectory, "ChangeLog.md") },
  { name: "", dst: path.join(appDirectory, "LICENSE") },
];

if (programOptions.withWinston) {
  packagesToInstall.save.push("winston");
}

if (programOptions.withPipelines) {
  templateFiles.push({
    name: "Jenkinsfile",
    dst: path.join(appDirectory, "Jenkinsfile"),
  });
}

if (programOptions.withDocker) {
  templateFiles.push({
    name: "Dockerfile",
    dst: path.join(appDirectory, "Dockerfile"),
  });
  templateFiles.push({
    name: "docker-compose.yml",
    dst: path.join(appDirectory, "docker-compose.yml"),
  });
}

if (
  Array.isArray(programOptions.extraPackages) &&
  programOptions.extraPackages.length > 0
) {
  programOptions.extraPackages.forEach((pkg) => {
    let match = pkg.match(/^(.+)\:\:dev$/);
    if (match) {
      packagesToInstall.dev.push(match[1]);
    } else {
      packagesToInstall.save.push(pkg);
    }
  });
}

console.log(`[create-express-app] Creating express project: ${appName}`.cyan);
console.log(
  `[create-express-app] Packages to install as development: ${
    packagesToInstall.dev.join(", ").yellow
  }`
);
console.log(
  `[create-express-app] Packages to install as production: ${
    packagesToInstall.save.join(", ").yellow
  }`
);

console.log("[create-express-app] Do you want to proceed ? [y/N]");
// Confirmation
try {
  await keyPress(["y", "Y"]);
} catch (err) {
  console.log("[create-express-app] Terminated".red);
  process.exit(1);
}

/** 1. Create project directory. */
console.log("[create-express-app] Creating project directory. ".cyan);
const cmd = shelljs.mkdir([appDirectory]);
if (cmd.code !== 0) {
  console.error(
    `[create-express-app] Cannot create project directory: ${cmd.stderr}`.red
  );
  process.exit(1);
}

/** 2. Initialize project. */
console.log("[create-express-app] Initializing project. ".cyan);
let result = shelljs.exec("npm init -y", { cwd: appDirectory });
if (result.code !== 0) {
  console.error(
    `[create-express-app] Cannot initialize project: ${cmd.stderr}`.red
  );
  process.exit(1);
}

/** 3. Create git repository. */
console.log("[create-express-app] Initializing empty git repository. ".cyan);
result = shelljs.exec("git init", { cwd: appDirectory });
if (result.code !== 0) {
  console.error(
    `[create-express-app] Cannot create git repository: ${cmd.stderr}`.red
  );
  process.exit(1);
}

/** 4. Install required packages. */
console.log(
  "[create-express-app] Installing required packages for production".cyan
);
result = shelljs.exec(
  `npm install --save ${packagesToInstall.save.join(" ")}`,
  { cwd: appDirectory }
);
if (result.code !== 0) {
  console.error(
    `[create-express-app] Cannot install required packages: ${cmd.stderr}`.red
  );
  process.exit(1);
}

console.log(
  "[create-express-app] Installing required packages for development".cyan
);
result = shelljs.exec(
  `npm install --save-dev ${packagesToInstall.dev.join(" ")}`,
  { cwd: appDirectory }
);
if (result.code !== 0) {
  console.error(
    `[create-express-app] Cannot install required packages: ${cmd.stderr}`.red
  );
  process.exit(1);
}

/** 5. Initialize folder structure */
console.log("[create-express-app] Initializing folder structure.".cyan);
directoriesToCreate.forEach((directory) => {
  result = shelljs.mkdir([path.join(appDirectory, directory)]);
  if (result.code !== 0) {
    console.error(
      `[create-express-app] Cannot initialize folder structure: ${result.stderr}`
    );
    process.exit(1);
  }
});

/** 6. Copy template files. */
console.log("[create-express-app] Copying template files.".cyan);
templateFiles.forEach((file) => {
  if (file.name.length > 0) {
    result = shelljs.cp(path.join(__dirname, "templates", file.name), file.dst);
    if (result.code !== 0) {
      console.error(
        `[create-express-app] Cannot copy template file: ${file.name}: ${result.stderr}`
      );
      process.exit(1);
    }
  } else {
    result = shelljs.touch([file.dst]);
    if (result.code !== 0) {
      console.error(
        `[create-express-app] Cannot touch file: ${file.dst}: ${result.stderr}`
      );
      process.exit(1);
    }
  }
});

/** 7. Change package.json */
console.log("[create-express-app] Changing package.json".cyan);
const packageJsonPath = path.join(appDirectory, "package.json");

const fileContents = await fs.promises.readFile(packageJsonPath);
const packageJson = JSON.parse(fileContents.toString());

packageJson.main = "src/server.ts";
packageJson.scripts["dev"] =
  "DOTENV_CONFIG_PATH=.env.development NODE_ENV=dev ts-node -r tsconfig-paths/register -r dotenv/config src/server.ts";
packageJson.scripts["test"] =
  "DOTENV_CONFIG_PATH=.env.development NODE_ENV=test mocha --check-leaks -r ts-node/register -r tsconfig-paths/register -r dotenv/config tests/**/*.test.ts";
packageJson.scripts["build"] = "tsc -p .";
packageJson.scripts["start"] =
  "npm run build && DOTENV_CONFIG_PATH=.env.production NODE_ENV=production TS_NODE_BASEURL=./dist node -r tsconfig-paths/register -r dotenv/config ./dist/server.js";
packageJson.scripts["watch"] =
  "DOTENV_CONFIG_PATH=.env.development NODE_ENV=dev nodemon -r dotenv/config -r tsconfig-paths/register src/server.ts";
packageJson.scripts["lint"] = "eslint .";
packageJson.scripts["coverage"] =
  "DOTENV_CONFIG_PATH=.env.development NODE_ENV=test nyc mocha --check-leaks -r ts-node/register -r tsconfig-paths/register -r dotenv/config tests/**/*.test.ts";
packageJson.scripts["pipe:coverage"] =
  "npm run coverage && node coverage-result.mjs 100";
packageJson["nyc"] = {
  extension: [".ts", ".tsx"],
  include: ["src"],
  exclude: ["src/server.ts", "**/*.d.ts", "**/*.test.ts"],
  reporter: ["html", "text", "json-summary"],
  all: true,
};
packageJson["private"] = true;

await fs.promises.writeFile(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2)
);

console.log("[create-express-app] All OK.".green);
process.exit(0);
