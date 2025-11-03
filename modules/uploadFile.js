const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { deletePdfFiles } = require("./deleteFile"); // 함수만 import

const inDir = path.join(__dirname, "..", "input");

const storage = multer.diskStorage({
  destination: function (_, _, cb) {
    cb(null, inDir);
  },
  filename: function (_, file, cb) {
    cb(null, file.originalname); // 원본 파일 이름으로 설정
  },
});
const upload = multer({ storage: storage });

const _u = function (req, res) {
  function uploadFile() {
    upload.single("myFile")(req, res, err => {
      if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).send("Internal server error.");
      }
      console.log("File uploaded successfully");
      console.log(req.file);
      res.end();
    });
  }
  fs.readdir(inDir, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }
    // 파일 존재시 기존 파일 삭제
    if (files.length > 1) {
      deletePdfFiles(); // 함수 직접 호출 (req, res 불필요)
    }
    uploadFile();
  });
};

module.exports = _u;
