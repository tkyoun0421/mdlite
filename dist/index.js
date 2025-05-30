#!/usr/bin/env node
import * as fs from "fs/promises";
import * as path from "path";
import inquirer from "inquirer";
var args = process.argv.slice(2);
var configFileName = ".mdlite-config.json";
var configFilePath = path.join(process.cwd(), configFileName);
function parseArgs(args2) {
  let dir = void 0;
  let fileName = void 0;
  let changeDir = false;
  for (let i = 0; i < args2.length; i++) {
    const arg = args2[i];
    if (arg === "--dir" && i + 1 < args2.length) {
      dir = args2[i + 1];
      i++;
    } else if (arg === "--change") {
      changeDir = true;
    } else if (!arg.startsWith("--") && !fileName) {
      fileName = arg;
    }
  }
  return { dir, fileName, changeDir };
}
async function readConfig() {
  try {
    const data = await fs.readFile(configFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}
async function writeConfig(config) {
  const data = JSON.stringify(config, null, 2);
  await fs.writeFile(configFilePath, data, "utf-8");
}
async function getLastDir() {
  const config = await readConfig();
  return config.lastDir;
}
async function setLastDir(dir) {
  const config = await readConfig();
  config.lastDir = dir;
  await writeConfig(config);
}
async function chooseDirectory(baseDir) {
  const items = await fs.readdir(baseDir, { withFileTypes: true });
  const folders = items.filter((item) => item.isDirectory()).map((item) => item.name);
  const choices = [...folders];
  if (baseDir !== path.parse(baseDir).root) {
    choices.push("[\uC0C1\uC704 \uD3F4\uB354\uB85C \uB3CC\uC544\uAC00\uAE30]");
  }
  choices.push("[\uD604\uC7AC \uD3F4\uB354 \uC120\uD0DD]");
  const { selectedFolder } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFolder",
      message: `\uD3F4\uB354\uB97C \uC120\uD0DD\uD558\uC138\uC694 (\uD604\uC7AC: ${path.basename(baseDir)}):`,
      choices,
    },
  ]);
  if (selectedFolder === "[\uD604\uC7AC \uD3F4\uB354 \uC120\uD0DD]") {
    return baseDir;
  }
  if (selectedFolder === "[\uC0C1\uC704 \uD3F4\uB354\uB85C \uB3CC\uC544\uAC00\uAE30]") {
    return chooseDirectory(path.dirname(baseDir));
  }
  return chooseDirectory(path.join(baseDir, selectedFolder));
}
async function getMarkdownFiles(dir) {
  const items = await fs.readdir(dir);
  const markdowns = [];
  await Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dir, item);
      const stat2 = await fs.stat(fullPath);
      if (stat2.isFile() && path.extname(item) === ".md") {
        markdowns.push(item);
      }
    })
  );
  return markdowns;
}
async function readFileAndPrint(dir, fileName) {
  const filePath = path.join(dir, fileName);
  const content = await fs.readFile(filePath, "utf-8");
  console.log(`
==== \u{1F4C4} ${fileName} ====
`);
  console.log(content);
}
async function main() {
  const { dir: dirArg, fileName: fileArg, changeDir } = parseArgs(args);
  const lastDir = await getLastDir();
  const startDir = changeDir ? process.cwd() : dirArg || lastDir || process.cwd();
  const selectedDir = await chooseDirectory(startDir);
  await setLastDir(selectedDir);
  const markdownFiles = await getMarkdownFiles(selectedDir);
  if (markdownFiles.length === 0) {
    console.log(`\u{1F4C2} '${selectedDir}' \uD3F4\uB354 \uB0B4\uC758 Markdown \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.`);
    return;
  }
  if (fileArg) {
    let inputName = fileArg;
    if (path.extname(inputName) !== ".md") {
      inputName += ".md";
    }
    const matched = markdownFiles.find((f) => f.toLowerCase() === inputName.toLowerCase());
    if (!matched) {
      console.log(`\u274C '${inputName}' \uD30C\uC77C\uC774 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`);
      return;
    }
    await readFileAndPrint(selectedDir, matched);
    return;
  }
  const { selectedFile } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFile",
      message: "\uC77D\uC744 Markdown \uD30C\uC77C\uC744 \uC120\uD0DD\uD558\uC138\uC694:",
      choices: markdownFiles,
    },
  ]);
  await readFileAndPrint(selectedDir, selectedFile);
}
main();
//# sourceMappingURL=index.js.map
