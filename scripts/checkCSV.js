const fs = require('fs');
const path = require('path');

// CSV文件路径
const COMPANY_CSV = path.join(__dirname, '..', '公司介绍.csv');

// CSV解析函数（与convertCSV.js相同的逻辑）
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
                } else if (currentRow.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = currentRow[index];
                    });
                    data.push(row);
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

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (headers && currentRow.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = currentRow[index];
            });
            data.push(row);
        }
    }

    return data;
}

console.log('读取CSV文件...\n');
const content = fs.readFileSync(COMPANY_CSV, 'utf-8');
const data = parseCSV(content);

console.log(`✅ 解析到 ${data.length} 条数据记录\n`);

// 统计企业名称
const companyNames = new Map();
data.forEach((row, index) => {
    const name = row['企业名称'] || row['✅企业名称'];
    if (name) {
        if (companyNames.has(name)) {
            companyNames.get(name).push(index + 2); // +2 因为第1行是表头，索引从0开始
        } else {
            companyNames.set(name, [index + 2]);
        }
    }
});

console.log(`📊 唯一企业数量: ${companyNames.size}\n`);

// 检查重复
const duplicates = [];
companyNames.forEach((indices, name) => {
    if (indices.length > 1) {
        duplicates.push({ name, indices });
    }
});

if (duplicates.length > 0) {
    console.log(`⚠️ 发现 ${duplicates.length} 个重复的企业名称:\n`);
    duplicates.forEach(dup => {
        console.log(`  "${dup.name}" 出现 ${dup.indices.length} 次，在数据行: ${dup.indices.join(', ')}`);
    });
} else {
    console.log('✅ 没有发现重复的企业名称\n');
}

// 列出所有企业名称（前50个）
console.log('\n📝 前50个企业名称:');
const names = Array.from(companyNames.keys());
names.slice(0, 50).forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
});

if (names.length > 50) {
    console.log(`  ... 还有 ${names.length - 50} 个企业`);
}

console.log(`\n总计: ${names.length} 家企业`);
