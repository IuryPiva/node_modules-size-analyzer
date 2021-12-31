import { walk, walkSync } from "https://deno.land/std@0.119.0/fs/mod.ts";
import { join as pathJoin } from "https://deno.land/std@0.119.0/path/mod.ts";
import { toMegabits } from "./display.ts";
import { appPath } from "./env.ts";
import { PackageLock } from "./package-lock.ts";

const nodeModules = "node_modules/";

function getModuleName(path: string) {
  const packageName = getPackageName(path);

  return path.slice(
    path.indexOf(nodeModules),
    path.indexOf(nodeModules + packageName) + packageName.length +
      nodeModules.length,
  );
}

function getPackageName(path: string) {
  const filePath = path.slice(path.indexOf(nodeModules));

  let packageName = filePath.slice(
    filePath.lastIndexOf(nodeModules) + nodeModules.length,
  );

  if (packageName.startsWith("@")) {
    packageName = packageName.split("/").slice(0, 2).join("/");
  } else {
    packageName = packageName.slice(0, packageName.indexOf("/"));
  }

  return packageName;
}

export async function getPackageSizes() {
  const packageMap: Map<string, number> = new Map();

  for await (const entry of walk(pathJoin(appPath, "./node_modules"))) {
    if (entry.isFile) {
      const moduleName = getModuleName(entry.path);

      const size = packageMap.get(moduleName) || 0;
      const stat = await Deno.stat(entry.path);
      packageMap.set(moduleName, size + stat.size);
    }
  }

  return packageMap;
}

export function getPackageSize(moduleName: string) {
  let size = 0;

  for (const entry of walkSync(pathJoin(appPath, moduleName))) {
    if (entry.isFile) {
      size += Deno.statSync(entry.path).size;
    }
  }

  return size;
}

async function readJson(jsonFile: string) {
  return JSON.parse(
    await Deno.readTextFile(
      pathJoin(appPath, jsonFile),
    ),
  );
}

const lock: PackageLock = await readJson("package-lock.json");
export type DepMap = Map<string, DepMap>;

const completeDepMap: Map<string, string[]> = new Map();

function recursiveDeps(moduleName = "") {
  const packageInfo = lock.packages[moduleName];
  const dependencies = packageInfo.dependencies
    ? Object.keys(packageInfo.dependencies)
    : [];
  completeDepMap.set(moduleName, Object.keys(dependencies));
  const depMap: DepMap = new Map();
  const prefix = moduleName.length ? moduleName + "/" : "";

  for (const key of dependencies) {
    const depPrefixName = `${prefix}node_modules/${key}`;
    if (lock.packages[depPrefixName]) {
      if (completeDepMap.has(depPrefixName)) console.log({ depPrefixName });
      else depMap.set(depPrefixName, recursiveDeps(depPrefixName));
    } else {
      const depModuleName = `node_modules/${key}`;
      if (completeDepMap.has(depModuleName)) console.log({ depModuleName });
      else depMap.set(depModuleName, recursiveDeps(depModuleName));
    }
  }

  return depMap;
}

export function getPkgDeps(dev = false) {
  const packageInfo = lock.packages[""];
  return dev ? packageInfo.devDependencies : packageInfo.dependencies;
}

export function getDeps(dev = false) {
  const packageInfo = lock.packages[""];

  const dependencies = dev
    ? packageInfo.devDependencies
    : packageInfo.dependencies;

  const depMap: DepMap = new Map();

  if (!dependencies) return depMap;

  for (const key of Object.keys(dependencies)) {
    const depModuleName = `node_modules/${key}`;
    depMap.set(depModuleName, recursiveDeps(depModuleName));
  }

  return depMap;
}

export function getDevDeps() {
  return getDeps(true);
}

export function directDeps(moduleName: string) {
  const deps = lock.packages[moduleName].dependencies;

  if (moduleName == "") return deps ? Object.keys(deps).slice() : [];

  return deps ? Object.keys(deps) : [];
}

async function statDep(name: string) {
  try {
    return [name, await (await Deno.stat(pathJoin(appPath, name))).size];
  } catch (_error) {
    console.log("not found", pathJoin(appPath, name));
    return [];
  }
}

const depTree: string[] = [];
const depSizeMap = new Map()
let pkgSize = 0

export function getFlatDeps(
  packageName = "",
  set = new Set(),
  level = 1,
) {
  const prev = pkgSize;
  console.log({ packageName, pkgSize, level });

  for (const key of directDeps(packageName)) {
    const packageName = `node_modules/${key}`;

    if (level == 1) {
      depTree.push("\n");
      pkgSize = 0;
    }

    const size = getPackageSize(`./${packageName}`);
    pkgSize += size;
    console.log({ key, pkgSize, size, change: pkgSize - prev });

    if (set.has(key)) continue;
    else {
      set.add(key);
      getFlatDeps(packageName, set, level + 1);
    }

    depTree.push(new Array(level).join("--> ").concat(key));
    depTree.push(" ", toMegabits(pkgSize), "\n");
  }

  if (level == 1) Deno.writeTextFileSync("depTree.txt", depTree.join(""));
  return set;
}
