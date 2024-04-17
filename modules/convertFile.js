const path = require("path");

const { exec } = require("child_process");

const inDir = path.join(__dirname, "..", "input");
const outDir = path.join(__dirname, "..", "output");

const _c = function (req, res) {
  const data = {
    type: req.body.type,
    page: req.body.page,
    fileName: req.body.fileName,
  };
  if (!data) {
    res.status(400).send("Invalid request body");
    return;
  }

  async function convertFile() {
    const promises = []; // 각 페이지 변환 작업의 프로미스를 담을 배열

    for (let i = 0; i < data.page.length; i++) {
      const filePath = path.join(__dirname, "..", "pdf-svg", "pdf2svg.exe");
      const inputPdfPath = path.join(inDir, `${data.fileName}.pdf`);
      const outputSvgPath = path.join(outDir, `${data.fileName}_${String(data.page[i]).padStart(3, "0")}.svg`);
      const command = `"${filePath}" "${inputPdfPath}" "${outputSvgPath}" ${data.page[i]}`;

      const promise = new Promise((resolve, reject) => {
        exec(command, (error) => {
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
};

module.exports = _c;
