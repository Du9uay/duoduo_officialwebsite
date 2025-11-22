const fs = require('fs');

const content = fs.readFileSync('公司介绍.csv', 'utf-8');
const lines = content.split('\n');

console.log('第783-788行内容分析:\n');

for (let i = 782; i <= 787; i++) {
    const line = lines[i];
    console.log(`\n第${i+1}行 (长度: ${line.length}):`);
    console.log(line.substring(0, 200) + '...');
    console.log('末尾100字符:', line.substring(line.length - 100));
}
