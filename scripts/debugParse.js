const fs = require('fs');
const path = require('path');

// 使用与convertCSV.js相同的解析函数
function parseCSV(content) {
    const data = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let headers = null;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());

                if (!headers) {
                    headers = currentRow;
                    console.log('表头字段数:', headers.length);
                    console.log('表头:', headers);
                } else if (currentRow.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = currentRow[index];
                    });
                    data.push(row);
                } else {
                    console.log(`⚠️ 跳过字段数不匹配的行: 期望${headers.length}个字段，实际${currentRow.length}个`);
                    console.log('  字段内容:', currentRow.map((f, i) => `[${i}] ${f.substring(0, 30)}...`).join(', '));
                }

                currentRow = [];
                currentField = '';
            }
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        } else {
            currentField += char;
        }
    }

    // 处理最后一行
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        console.log('\n最后一行字段数:', currentRow.length);
        if (headers && currentRow.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = currentRow[index];
            });
            data.push(row);
            console.log('✅ 最后一行被成功解析');
        } else {
            console.log('❌ 最后一行字段数不匹配，被跳过');
            console.log('  期望字段数:', headers ? headers.length : '未知');
            console.log('  实际字段数:', currentRow.length);
            if (currentRow.length > 0) {
                console.log('  第1个字段:', currentRow[0].substring(0, 50));
            }
        }
    }

    return data;
}

const content = fs.readFileSync(path.join(__dirname, '..', '公司介绍.csv'), 'utf-8');
const data = parseCSV(content);

console.log('\n解析结果统计:');
console.log('总记录数:', data.length);

console.log('\n最后10家企业:');
data.slice(-10).forEach((row, index) => {
    const name = row['企业名称'] || row['✅企业名称'];
    console.log(`  ${data.length - 10 + index + 1}. ${name}`);
});

// 搜索这两家企业
const hengrui = data.find(row => {
    const name = row['企业名称'] || row['✅企业名称'];
    return name && name.includes('江苏恒瑞医药');
});

const ates = data.find(row => {
    const name = row['企业名称'] || row['✅企业名称'];
    return name && name.includes('宿迁阿特斯');
});

console.log('\n查找结果:');
console.log('江苏恒瑞医药:', hengrui ? '✅ 找到' : '❌ 未找到');
console.log('宿迁阿特斯:', ates ? '✅ 找到' : '❌ 未找到');
