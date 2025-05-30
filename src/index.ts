#!/usr/bin/env node
import * as fs from "fs/promises";
import * as path from "path";
import inquirer from "inquirer";

const args = process.argv.slice(2);
const configFileName = ".mdlite-config.json";
const configFilePath = path.join(process.cwd(), configFileName);

interface ParsedArgs {
  dir?: string;
  fileName?: string;
  changeDir: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  let dir: string | undefined = undefined;
  let fileName: string | undefined = undefined;
  let changeDir = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dir" && i + 1 < args.length) {
      dir = args[i + 1];
      i++;
    } else if (arg === "--change") {
      changeDir = true;
    } else if (!arg.startsWith("--") && !fileName) {
      fileName = arg;
    }
  }

  return { dir, fileName, changeDir };
}

async function readConfig(): Promise<{ lastDir?: string }> {
  try {
    const data = await fs.readFile(configFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeConfig(config: { lastDir?: string }): Promise<void> {
  const data = JSON.stringify(config, null, 2);
  await fs.writeFile(configFilePath, data, "utf-8");
}

async function getLastDir(): Promise<string | undefined> {
  const config = await readConfig();
  return config.lastDir;
}

async function setLastDir(dir: string): Promise<void> {
  const config = await readConfig();
  config.lastDir = dir;
  await writeConfig(config);
}

async function chooseDirectory(baseDir: string): Promise<string> {
  const items = await fs.readdir(baseDir, { withFileTypes: true });
  const folders = items.filter((item) => item.isDirectory()).map((item) => item.name);

  const choices = [...folders];
  if (baseDir !== path.parse(baseDir).root) {
    choices.push("[상위 폴더로 돌아가기]");
  }
  choices.push("[현재 폴더 선택]");

  const { selectedFolder } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFolder",
      message: `폴더를 선택하세요 (현재: ${path.basename(baseDir)}):`,
      choices,
    },
  ]);

  if (selectedFolder === "[현재 폴더 선택]") {
    return baseDir;
  }

  if (selectedFolder === "[상위 폴더로 돌아가기]") {
    return chooseDirectory(path.dirname(baseDir));
  }

  return chooseDirectory(path.join(baseDir, selectedFolder));
}

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const items = await fs.readdir(dir);
  const markdowns: string[] = [];

  await Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isFile() && path.extname(item) === ".md") {
        markdowns.push(item);
      }
    })
  );

  return markdowns;
}

async function readFileAndPrint(dir: string, fileName: string) {
  const filePath = path.join(dir, fileName);
  const content = await fs.readFile(filePath, "utf-8");
  console.log(`\n==== 📄 ${fileName} ====\n`);
  console.log(content);
}

async function main() {
  try {
    const { dir: dirArg, fileName: fileArg, changeDir } = parseArgs(args);
    const lastDir = await getLastDir();

    const startDir = changeDir ? process.cwd() : dirArg || lastDir || process.cwd();
    const selectedDir = await chooseDirectory(startDir);

    await setLastDir(selectedDir);

    const markdownFiles = await getMarkdownFiles(selectedDir);
    if (markdownFiles.length === 0) {
      console.log(`📂 '${selectedDir}' 폴더 내의 Markdown 파일이 없습니다.`);
      return;
    }

    if (fileArg) {
      let inputName = fileArg;
      if (path.extname(inputName) !== ".md") {
        inputName += ".md";
      }

      const matched = markdownFiles.find((f) => f.toLowerCase() === inputName.toLowerCase());

      if (!matched) {
        console.log(`❌ '${inputName}' 파일이 존재하지 않습니다.`);
        return;
      }

      await readFileAndPrint(selectedDir, matched);
      return;
    }

    main();

    const { selectedFile } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedFile",
        message: "읽을 Markdown 파일을 선택하세요:",
        choices: markdownFiles,
      },
    ]);

    await readFileAndPrint(selectedDir, selectedFile);
  } catch (error) {
    console.error("오류 발생:", error);
    process.exit(1);
  }
}

main();
