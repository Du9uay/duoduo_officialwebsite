const fs = require('fs');

// 读取最后10行
const content = fs.readFileSync('../公司介绍.csv', 'utf-8');
const lines = content.split('\n');

console.log('CSV文件总行数:', lines.length);
console.log('\n最后10行:');
lines.slice(-11, -1).forEach((line, index) => {
    const lineNum = lines.length - 11 + index;
    console.log(`第${lineNum}行 (前100字符): ${line.substring(0, 100)}...`);
});

// 查找江苏恒瑞医药
const hengruiIndex = lines.findIndex(line => line.includes('江苏恒瑞医药'));
if (hengruiIndex >= 0) {
    console.log('\n✅ 找到江苏恒瑞医药，在第', hengruiIndex + 1, '行');
    console.log('内容:', lines[hengruiIndex].substring(0, 150));
} else {
    console.log('\n❌ 未找到江苏恒瑞医药');
}

// 查找宿迁阿特斯
const atesIndex = lines.findIndex(line => line.includes('宿迁阿特斯'));
if (atesIndex >= 0) {
    console.log('\n✅ 找到宿迁阿特斯，在第', atesIndex + 1, '行');
    console.log('内容:', lines[atesIndex].substring(0, 150));
} else {
    console.log('\n❌ 未找到宿迁阿特斯');
}
