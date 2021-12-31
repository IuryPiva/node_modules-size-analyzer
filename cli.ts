import { appPath } from "./env.ts";
import { getDeps, getDevDeps, getFlatDeps, getPkgDeps } from "./fs.ts";
import { depsSize, nodeModulesSize } from "./mod.ts";

if (import.meta.main && appPath) {
  // nodeModulesSize()
  // console.log("Dependencies:")
  // depsSize(getDeps());
  // console.log("Dev dependencies:")
  // depsSize(getDevDeps());
  await getFlatDeps()
}
