const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: "../dist",
  devServer: {
    proxy: {
      "/upload": { 
        target: "http://localhost:3000", 
        changeOrigin: true 
      },
      "/convert": { 
        target: "http://localhost:3000", 
        changeOrigin: true 
      },
      "/getSVGFiles": { 
        target: "http://localhost:3000", 
        changeOrigin: true 
      },
    },
  },
});
