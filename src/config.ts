import Conf from "conf";

const config = new Conf({
  projectName: "mdlite",
});

export function getLastDir(): string | undefined {
  return config.get("lastDir") as string | undefined;
}

export function setLastDir(dir: string): void {
  config.set("lastDir", dir);
}
