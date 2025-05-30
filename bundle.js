import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node", // Node.js 환경임을 명시
    format: "esm", // ES module 형식으로 출력
    outfile: "dist/index.js",
    target: ["node22"], // node 버전 명시 (최신 버전 권장)
    sourcemap: true,
    external: ["conf", "inquirer", "node:util"], // node 내장 모듈은 외부 처리
  })
  .catch(() => process.exit(1));
