export type Lib = [string, number];

export class LibSorter {
  private weights: number[] = [];
  private sorted_libs: Lib[] = [];

  constructor(private libs: Lib[] = []) {}

  push(lib: Lib) {
    this.libs.push(lib);
  }

  private sortWeights() {
    this.weights.sort((a, b) => b - a);
  }

  byWeight(): Lib[] {
    this.weights = this.libs.map((lib) => lib[1]);
    this.sortWeights();

    for (const lib of this.libs) {
      const i = this.weights.indexOf(lib[1]);
      if (i == -1) throw new Error(`Lib out of index ${lib}`);

      this.sorted_libs[i] = lib;
      this.weights[i] = Date.now();
    }

    return this.sorted_libs;
  }
}
