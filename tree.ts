import { toMegabits } from "./display.ts";
import { directDeps } from "./fs.ts";

type Branch = {
  key: string;
  branches: Map<string, Branch>;
  parent?: Branch;
  level: number;
};

export class Tree {
  level = 0;
  root: Branch = { key: "", branches: new Map(), level: 0 };

  constructor() {
    this.currentBranch = this.root;
  }

  currentBranch: Branch;

  up() {
    const next = this.currentBranch.parent;

    if (!next) {
      throw new Error("Current branch does not have a parent");
    }

    this.currentBranch = next;
    this.level--;
  }

  downTo(key: string) {
    const next = this.currentBranch.branches.get(key);

    if (!next) {
      throw new Error(
        `Branch ${key} does not exist in ${this.currentBranch.key}. Branches from here: ${[
          ...this.currentBranch.branches.keys(),
        ]}`,
      );
    }

    this.currentBranch = next;
    this.level++;
  }

  add(key: string, branches = new Map()) {
    this.branch({ key, branches, level: this.level + 1 });
  }

  branch(node: Branch) {
    this.currentBranch.branches.set(node.key, {
      ...node,
      parent: this.currentBranch,
    });
  }

  log(from?: Branch) {
    const branch = from ? from : this.root;

    for (const [key, node] of branch.branches) {
      console.log(new Array(node.level).join("--> ").concat(key));

      this.log(node);
    }

    // just space
    if (branch.level == 1) console.log("");
  }
}

export function getFlatDeps(
  packageName = "",
  set = new Set(),
  level = 1,
  tree = new Tree(),
) {
  for (const key of directDeps(packageName)) {
    if (level == 1) {
      set = new Set();
    }

    tree.add(key);

    const packageName = `node_modules/${key}`;

    if (set.has(key)) continue;
    else {
      set.add(key);
      tree.downTo(key);
      getFlatDeps(packageName, set, level + 1, tree);
      tree.up();
    }
  }

  return tree;
}

getFlatDeps().log();
