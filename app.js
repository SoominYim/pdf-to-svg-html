const express = require("express");
const app = express();
const port = 3000;

const bodyParser = require("body-parser");

const uploadFile = require("./modules/uploadFile");
const convertFile = require("./modules/convertFile");
const getSVGFile = require("./modules/getSVGFile");
const deleteFile = require("./modules/deleteFile");

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/dist"));

// 라우트 핸들러 설정
app.post("/upload", uploadFile);

app.post("/convert", convertFile);

app.get("/deleteFile", deleteFile);

app.get("/getSVGFiles", getSVGFile);

// 서버 시작
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
app.get("/", (req, res) => {
  res.redirect("/");
});
