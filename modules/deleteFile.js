const path = require("path");
const fs = require("fs");

const inDir = path.join(__dirname, "..", "input");

const _d = (req, res) => {
  fs.readdir(inDir, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(inDir, file);

      // 파일 확장자가 '.pdf' 인 경우에만 삭제
      if (path.extname(file).toLowerCase() === ".pdf") {
        fs.unlink(filePath, err => {
          if (err) {
            console.error("Error deleting file:", filePath, err);
          } else {
            console.log("Deleted file:", filePath);
          }
        });
      }
    });
  });
};

module.exports = _d;
