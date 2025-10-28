module.exports = {
  module: {
    rules: [
      // 이미지 파일 처리를 위한 설정
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"],
      },
    ],
  },
  // 여기에 다른 Webpack 설정이 포함될 수 있습니다.
};
