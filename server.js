const multer = require("multer");
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const bodyParser = require("body-parser");
const inDir = path.join(__dirname, "input");
const outDir = path.join(__dirname, "output");
// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, inDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 원본 파일 이름으로 설정
  },
});
const upload = multer({ storage: storage });

app.use(bodyParser.json());

// URL-encoded 파서 사용
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(__dirname + "/dist"));

var pdfFile = "";

// 파일 업로드를 처리하는 라우트 핸들러 설정
app.post("/upload", (req, res) => {
  function uploadFile() {
    upload.single("myFile")(req, res, (err) => {
      if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).send("Internal server error.");
      }
      pdfFile = req.file.filename;
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
      files.forEach((file) => {
        const filePath = path.join(inDir, file);

        // 파일 확장자가 '.pdf' 인 경우에만 삭제
        if (path.extname(file).toLowerCase() === ".pdf") {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file:", filePath, err);
            } else {
              console.log("Deleted file:", filePath);
            }
          });
        }
      });
    }

    uploadFile();
  });
});

app.post("/convert", (req, res) => {
  const data = {
    type: req.body.type,
    page: req.body.page,
  };

  if (!data) {
    res.status(400).send("Invalid request body");
    return;
  }

  async function convertFile() {
    const promises = []; // 각 페이지 변환 작업의 프로미스를 담을 배열

    for (let i = 0; i < data.page.length; i++) {
      const filePath = path.join(__dirname, ".", "pdf-svg", "pdf2svg.exe");
      const inputPdfPath = path.join(inDir, `${pdfFile}`);
      const outputSvgPath = path.join(
        outDir,
        `${pdfFile.replace(".pdf", "")}_${String(data.page[i]).padStart(3, "0")}.svg`
      );
      const command = `"${filePath}" "${inputPdfPath}" "${outputSvgPath}" ${data.page[i]}`;

      const promise = new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error converting page ${data.page[i]}: ${error.message}`);
            reject(error);
          } else {
            console.log(`Converted page ${data.page[i]}`);
            resolve();
          }
        });
      });
      promises.push(promise);
    }

    try {
      // 모든 페이지 변환 작업이 완료될 때까지 기다림
      await Promise.all(promises);
      console.log("변환 끝");
      res.end(); // 모든 변환 작업이 완료된 후에 응답을 보냄
    } catch (error) {
      res.status(500).send("Error converting pages");
    }
  }

  exec("chcp 65001");
  console.log("PDF to svg convert start");

  if (data.type == "choice" || data.type == "ranger") {
    convertFile();
  } else {
    res.status(400).send("Invalid request body");
  }
});

app.get("/getSVGFiles", (req, res) => {
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
});

// 서버 시작
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
app.get("/", (req, res) => {
  res.redirect("/");
});
