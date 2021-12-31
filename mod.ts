import { green, yellow } from "https://deno.land/std@0.119.0/fmt/colors.ts";
import {
  DepMap,
  getPackageSize,
  getPackageSizes,
} from "./fs.ts";
import { LibSorter } from "./sorter.ts";
const packagesSizes = await getPackageSizes();

function toMegabits(val: number) {
  return (val * 1e-6).toFixed(2).concat("M");
}

export function nodeModulesSize() {
  console.log("Package count:", packagesSizes.size);

  const nodeModulesSize = Array.from(packagesSizes.values()).reduce(
    (total, current) => current + total,
    0,
  );

  console.log("node_modules size:", toMegabits(nodeModulesSize));
}

function getDepSize(depList: string[]): number {
  let size = 0;
  for (const dep of depList) {
    let packageSize = packagesSizes.get(dep);
    if (!packageSize) packageSize = getPackageSize(dep);

    size += packageSize;
  }

  return size;
}

function flattenDeps(depMap: DepMap, set: Set<string>) {
  for (const [depName, depDeps] of depMap.entries()) {
    set.add(depName);
    flattenDeps(depDeps, set);
  }

  return set;
}

export function depsSize(deps: DepMap) {
  const sorter = new LibSorter();

  for (const [pkg, depMap] of deps.entries()) {
    const flatDeps = Array.from(flattenDeps(depMap, new Set()));
    sorter.push([pkg, packagesSizes.get(pkg)! + getDepSize(flatDeps)]);
  }

  for (const [pkg, size] of sorter.byWeight()) {
    console.log(
      yellow(toMegabits(size)),
      green(pkg.split("node_modules/").pop()!),
    );
  }
}
