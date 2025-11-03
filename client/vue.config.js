const { defineConfig } = require("@vue/cli-service");
const target = process.env.TARGET || "http://localhost:3000";
const devServer = {
  proxy: {
    "/upload": {
      target: target,
      changeOrigin: true,
    },
    "/convert": {
      target: target,
      changeOrigin: true,
    },
    "/getSVGFiles": {
      target: target,
      changeOrigin: true,
    },
    "/deleteFile": {
      target: target,
      changeOrigin: true,
    },
  },
};

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: "../dist",
  devServer: devServer,
});
