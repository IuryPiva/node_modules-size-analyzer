import { join as pathJoin } from "https://deno.land/std@0.119.0/path/mod.ts";
export const appPath = pathJoin(Deno.cwd(), Deno.args[0] || "");
