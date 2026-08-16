const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
          alias: {
            "@": path.resolve(__dirname, ".."),
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
