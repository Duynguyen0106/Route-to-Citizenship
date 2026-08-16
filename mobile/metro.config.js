const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const appModules = path.resolve(projectRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(workspaceRoot, "lib")];
config.resolver.nodeModulesPaths = [appModules];
config.resolver.extraNodeModules = {
  "date-fns": path.join(appModules, "date-fns"),
  zod: path.join(appModules, "zod"),
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

config.resolver.blockList = [
  new RegExp(`${escapeRegex(workspaceRoot)}/\\.next/.*`),
  new RegExp(`${escapeRegex(workspaceRoot)}/node_modules/next/.*`),
  new RegExp(`${escapeRegex(workspaceRoot)}/node_modules/@prisma/.*`),
  new RegExp(`${escapeRegex(workspaceRoot)}/node_modules/prisma/.*`),
  new RegExp(`${escapeRegex(workspaceRoot)}/node_modules/jose/.*`),
  new RegExp(`${escapeRegex(workspaceRoot)}/lib/prisma\\.ts`),
  new RegExp(`${escapeRegex(workspaceRoot)}/lib/auth\\.ts`),
  new RegExp(`${escapeRegex(workspaceRoot)}/lib/db/.*`),
  new RegExp(`${escapeRegex(workspaceRoot)}/lib/api/.*`),
];

const pinned = {
  "date-fns": path.join(appModules, "date-fns/index.js"),
  zod: path.join(appModules, "zod/index.js"),
};

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    return context.resolveRequest(context, path.join(workspaceRoot, moduleName.slice(2)), platform);
  }
  if (pinned[moduleName]) {
    return { type: "sourceFile", filePath: pinned[moduleName] };
  }
  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
