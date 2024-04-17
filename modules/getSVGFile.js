const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "..", "output");

const _g = (_, res) => {
  fs.readdir(outDir, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal server error");
      return;
    }
    const svgFiles = files.filter((file) => path.extname(file) === ".svg");
    const svgFileContents = svgFiles.map((file) => {
      const filePath = path.join(outDir, file);
      return fs.readFileSync(filePath, "utf-8");
    });

    if (svgFiles.length > 0) {
      svgFiles.forEach((file) => {
        const filePath = path.join(outDir, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", filePath, err);
          } else {
            console.log("Deleted file:", filePath);
          }
        });
      });
    }
    res.json(svgFileContents);
  });
};

module.exports = _g;
