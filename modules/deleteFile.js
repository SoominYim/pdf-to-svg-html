const path = require("path");
const fs = require("fs");

const inDir = path.join(__dirname, "..", "input");

// 파일 삭제 로직을 별도 함수로 분리
const deletePdfFiles = () => {
  try {
    const files = fs.readdirSync(inDir);
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === ".pdf");

    pdfFiles.forEach(file => {
      const filePath = path.join(inDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log("Deleted file:", filePath);
      } catch (err) {
        console.error("Error deleting file:", filePath, err);
      }
    });

    return pdfFiles.length;
  } catch (err) {
    console.error("Error reading directory:", err);
    return 0;
  }
};

// Express 라우트 핸들러
const _d = (req, res) => {
  const deletedCount = deletePdfFiles();

  // res가 있고 아직 응답을 보내지 않았으면 응답 전송
  if (res && !res.headersSent) {
    if (deletedCount === 0) {
      return res.json({ message: "No PDF files to delete" });
    }
    return res.status(200).json({ message: `Deleted ${deletedCount} PDF files` });
  }
};

module.exports = _d;
module.exports.deletePdfFiles = deletePdfFiles; // 내부 함수도 export
