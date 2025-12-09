const fs = require('fs');
const path = require('path');

// 测试上传API
async function testUploadAPI() {
  try {
    const imagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    const imageBuffer = fs.readFileSync(imagePath);

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'test-image.jpg');

    const response = await fetch('http://localhost:3009/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('API响应状态:', response.status);
    console.log('API响应内容:', result);

    if (response.ok && result.data && result.data.url) {
      console.log('✅ 上传成功！');
      console.log('图片URL:', result.data.url);
    } else {
      console.log('❌ 上传失败:', result.error || '未知错误');
    }
  } catch (error) {
    console.error('请求错误:', error.message);
  }
}

// 运行测试
testUploadAPI();