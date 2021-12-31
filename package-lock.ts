export type PackageLock = {
  name: string;
  version: string;
  lockfileVersion: number;
  requires: boolean;
  packages: {
    [key: string]: {
      name: string;
      version: string;
      dependencies?: {
        [key: string]: string;
      };
      devDependencies?: {
        [key: string]: string;
      };
    };
  };
};
