const path = require("path");
const fs = require("fs");
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
    // 원본 파일 경로
    const originalPdfPath = path.join(inDir, `${data.fileName}.pdf`);
    // 임시 파일명 (영문으로만, 한글/특수문자 문제 해결)
    const tempFileName = `temp_${Date.now()}.pdf`;
    const tempPdfPath = path.join(inDir, tempFileName);

    try {
      // 원본 파일을 임시 파일명으로 복사
      fs.copyFileSync(originalPdfPath, tempPdfPath);
      console.log(`임시 파일 생성: ${tempFileName}`);

      const promises = []; // 각 페이지 변환 작업의 프로미스를 담을 배열

      for (let i = 0; i < data.page.length; i++) {
        const filePath = path.join(__dirname, "..", "pdf-svg", "pdf2svg.exe");
        // 임시 입력 파일 사용
        const inputPdfPath = tempPdfPath;
        // 임시 출력 파일명도 영문으로
        const tempOutputSvgPath = path.join(outDir, `temp_${Date.now()}_${String(data.page[i]).padStart(3, "0")}.svg`);
        const finalOutputSvgPath = path.join(outDir, `${data.fileName}_${String(data.page[i]).padStart(3, "0")}.svg`);
        const command = `"${filePath}" "${inputPdfPath}" "${tempOutputSvgPath}" ${data.page[i]}`;

        const promise = new Promise((resolve, reject) => {
          exec(command, error => {
            if (error) {
              console.error(`Error converting page ${data.page[i]}: ${error.message}`);
              reject(error);
            } else {
              try {
                // 변환 후 원래 파일명으로 변경
                fs.renameSync(tempOutputSvgPath, finalOutputSvgPath);
                console.log(`Converted page ${data.page[i]}`);
                resolve();
              } catch (renameError) {
                console.error(`Error renaming file: ${renameError.message}`);
                reject(renameError);
              }
            }
          });
        });
        promises.push(promise);
      }

      // 모든 페이지 변환 작업이 완료될 때까지 기다림
      await Promise.all(promises);

      // 임시 입력 파일 삭제
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
        console.log("임시 파일 삭제 완료");
      }

      console.log("변환 끝");
      res.end(); // 모든 변환 작업이 완료된 후에 응답을 보냄
    } catch (error) {
      // 에러 발생 시 임시 파일 정리
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
        console.log("에러 발생, 임시 파일 정리 완료");
      }
      console.error("변환 중 오류:", error);
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
