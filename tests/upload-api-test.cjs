const fs = require('fs');
const path = require('path');
const http = require('http');

// 测试上传API
function testUploadAPI() {
  const imagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
  const imageBuffer = fs.readFileSync(imagePath);

  // 创建FormData的边界
  const boundary = '----formdata-test-' + Date.now();
  const formData = [];

  // 添加文件
  formData.push(
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="test-image.jpg"\r\n`),
    Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
    imageBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  );

  const formDataLength = formData.reduce((acc, item) => acc + item.length, 0);
  const fullFormData = Buffer.concat(formData, formDataLength);

  const options = {
    hostname: 'localhost',
    port: 3009,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullFormData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('API响应状态:', res.statusCode);
      console.log('API响应内容:', data);

      try {
        const result = JSON.parse(data);
        if (res.statusCode === 200 && result.data && result.data.url) {
          console.log('✅ 上传成功！');
          console.log('图片URL:', result.data.url);
        } else {
          console.log('❌ 上传失败:', result.error || '未知错误');
        }
      } catch (e) {
        console.error('解析响应失败:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求错误:', error.message);
  });

  req.write(fullFormData);
  req.end();
}

// 运行测试
testUploadAPI();