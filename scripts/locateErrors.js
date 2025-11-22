const fs = require('fs');
const path = require('path');

// CSV解析函数,记录行号
function parseCSVWithLineNumbers(content) {
    const data = [];
    const errors = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let headers = null;
    let lineNum = 1;
    let rowStartLine = 2; // 第2行开始(第1行是表头)

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
                } else if (currentRow.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = currentRow[index];
                    });
                    data.push(row);
                } else {
                    // 记录错误及其行号
                    errors.push({
                        lineNum: rowStartLine,
                        expectedFields: headers.length,
                        actualFields: currentRow.length,
                        fields: currentRow.map(f => f.substring(0, 50))
                    });
                }

                rowStartLine = lineNum + 1;
                currentRow = [];
                currentField = '';
            }
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            lineNum++;
        } else {
            currentField += char;
        }
    }

    // 处理最后一行
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (headers && currentRow.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = currentRow[index];
            });
            data.push(row);
        } else {
            errors.push({
                lineNum: rowStartLine,
                expectedFields: headers ? headers.length : 0,
                actualFields: currentRow.length,
                fields: currentRow.map(f => f.substring(0, 50))
            });
        }
    }

    return { data, errors };
}

console.log('正在定位CSV格式错误的行号...\n');

const content = fs.readFileSync(path.join(__dirname, '..', '公司介绍.csv'), 'utf-8');
const result = parseCSVWithLineNumbers(content);

console.log('========== 错误记录详细位置 ==========\n');
console.log(`总共发现 ${result.errors.length} 条格式错误的记录\n`);

result.errors.forEach((error, index) => {
    console.log(`${index + 1}. 行号: ${error.lineNum}`);
    console.log(`   期望字段数: ${error.expectedFields}, 实际字段数: ${error.actualFields}`);
    console.log(`   第1个字段: ${error.fields[0] || '(空)'}...`);
    if (error.fields[1]) {
        console.log(`   第2个字段: ${error.fields[1]}...`);
    }

    // 特别标记用户关注的两家企业
    const firstField = error.fields[0] || '';
    if (firstField.includes('江苏恒瑞医药') || firstField.includes('宿迁阿特斯')) {
        console.log(`   ⚠️ 这是用户新添加的企业！`);
    }
    console.log('');
});

console.log('\n========== 按行号排序的错误行列表 ==========');
result.errors
    .sort((a, b) => a.lineNum - b.lineNum)
    .forEach(error => {
        const firstField = error.fields[0] || '';
        let label = '';
        if (firstField.includes('有限公司') || firstField.includes('股份')) {
            const match = firstField.match(/([^,，。；]+?(有限公司|股份有限公司|集团))/);
            label = match ? match[1] : '(无法提取)';
        } else {
            label = '(无法识别企业名称)';
        }
        console.log(`第 ${error.lineNum} 行: ${label}`);
    });
