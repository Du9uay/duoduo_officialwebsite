const fs = require('fs');
const path = require('path');

// 扩展的CSV解析函数,收集完整记录和不完整字段
function parseCSVWithSkipped(content) {
    const goodRecords = [];
    const skippedRows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let headers = null;
    let rowNum = 0;

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
                    goodRecords.push({
                        rowNum,
                        fields: currentRow
                    });
                } else {
                    skippedRows.push({
                        rowNum,
                        fields: currentRow
                    });
                }

                currentRow = [];
                currentField = '';
                rowNum++;
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
        if (headers && currentRow.length === headers.length) {
            goodRecords.push({
                rowNum,
                fields: currentRow
            });
        } else {
            skippedRows.push({
                rowNum,
                fields: currentRow
            });
        }
    }

    return { headers, goodRecords, skippedRows };
}

// 尝试修复被跳过的行
function fixSkippedRows(goodRecords, skippedRows, headers) {
    const allRecords = [];
    let goodIndex = 0;
    let skipIndex = 0;

    while (goodIndex < goodRecords.length || skipIndex < skippedRows.length) {
        if (goodIndex < goodRecords.length &&
            (skipIndex >= skippedRows.length || goodRecords[goodIndex].rowNum < skippedRows[skipIndex].rowNum)) {
            // 添加一个完整的记录
            allRecords.push(goodRecords[goodIndex].fields);
            goodIndex++;
        } else if (skipIndex < skippedRows.length) {
            const skipped = skippedRows[skipIndex];

            // 尝试修复这条记录
            if (skipped.fields.length < headers.length) {
                // 字段太少,可能需要从下一行借字段
                const combined = [...skipped.fields];

                // 查看下一个跳过的行
                let nextSkipIndex = skipIndex + 1;
                while (combined.length < headers.length && nextSkipIndex < skippedRows.length) {
                    const nextSkipped = skippedRows[nextSkipIndex];
                    if (nextSkipped.rowNum === skipped.rowNum + (nextSkipIndex - skipIndex)) {
                        // 连续的跳过行,合并字段
                        combined.push(...nextSkipped.fields);
                        nextSkipIndex++;
                    } else {
                        break;
                    }
                }

                if (combined.length === headers.length) {
                    allRecords.push(combined);
                    skipIndex = nextSkipIndex;
                } else if (combined.length > headers.length) {
                    // 字段太多,取前5个
                    allRecords.push(combined.slice(0, headers.length));
                    skipIndex = nextSkipIndex;
                } else {
                    // 还是不够,跳过
                    console.log(`⚠️  无法修复第${skipped.rowNum}行: 字段数${combined.length}/${headers.length}`);
                    skipIndex++;
                }
            } else if (skipped.fields.length > headers.length) {
                // 字段太多,可能包含了下一条记录的一部分
                // 尝试拆分
                const firstRecord = skipped.fields.slice(0, headers.length);
                const remaining = skipped.fields.slice(headers.length);

                allRecords.push(firstRecord);

                // 将剩余字段作为新的跳过行处理
                if (remaining.length > 0) {
                    skippedRows.splice(skipIndex + 1, 0, {
                        rowNum: skipped.rowNum + 0.5,
                        fields: remaining
                    });
                }

                skipIndex++;
            } else {
                // 字段数正确
                allRecords.push(skipped.fields);
                skipIndex++;
            }
        }
    }

    return allRecords;
}

// 转义CSV字段
function escapeCSVField(field) {
    if (!field) return '';

    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
        const escaped = field.replace(/"/g, '""');
        return `"${escaped}"`;
    }
    return field;
}

console.log('正在修复CSV文件...\n');

const csvPath = path.join(__dirname, '..', '公司介绍.csv');
const content = fs.readFileSync(csvPath, 'utf-8');

console.log('步骤1: 解析CSV,区分完整记录和跳过的行...');
const { headers, goodRecords, skippedRows } = parseCSVWithSkipped(content);
console.log(`   表头: ${headers.join(', ')}`);
console.log(`   完整记录: ${goodRecords.length}`);
console.log(`   跳过的行: ${skippedRows.length}\n`);

console.log('步骤2: 尝试修复跳过的行...');
const allRecords = fixSkippedRows(goodRecords, skippedRows, headers);
console.log(`   修复后总记录数: ${allRecords.length}\n`);

console.log('步骤3: 生成修复后的CSV内容...');
const lines = [];
lines.push(headers.map(escapeCSVField).join(','));

allRecords.forEach(record => {
    lines.push(record.map(escapeCSVField).join(','));
});

const fixedContent = lines.join('\n');

// 输出到新文件
const fixedPath = path.join(__dirname, '..', '公司介绍_fixed_v2.csv');
fs.writeFileSync(fixedPath, fixedContent, 'utf-8');

console.log(`✅ 修复完成!`);
console.log(`   原始完整记录: ${goodRecords.length}`);
console.log(`   原始跳过记录: ${skippedRows.length}`);
console.log(`   修复后总记录: ${allRecords.length}`);
console.log(`   输出文件: 公司介绍_fixed_v2.csv\n`);

console.log('正在验证修复后的文件...');
const verifyContent = fs.readFileSync(fixedPath, 'utf-8');
const verifyResult = parseCSVWithSkipped(verifyContent);
console.log(`   验证结果:`);
console.log(`   - 完整记录: ${verifyResult.goodRecords.length}`);
console.log(`   - 跳过的行: ${verifyResult.skippedRows.length}`);

if (verifyResult.skippedRows.length === 0) {
    console.log('\n✅ 修复成功!所有记录都符合格式要求。');
    console.log('请检查修复后的文件内容,如果正确,可以替换原文件。');
} else {
    console.log(`\n⚠️ 还有 ${verifyResult.skippedRows.length} 行需要手动处理。`);
}
