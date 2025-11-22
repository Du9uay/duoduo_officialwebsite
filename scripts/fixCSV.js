const fs = require('fs');
const path = require('path');

// CSV解析函数,收集所有字段
function parseCSVToRawFields(content) {
    const allFields = [];
    let currentField = '';
    let inQuotes = false;

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
            allFields.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentField.trim()) {
                allFields.push(currentField.trim());
            }
            currentField = '';

            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        } else {
            currentField += char;
        }
    }

    if (currentField.trim()) {
        allFields.push(currentField.trim());
    }

    return allFields;
}

// 判断一个字段是否可能是企业名称
function looksLikeCompanyName(field) {
    return field && (
        field.includes('有限公司') ||
        field.includes('股份有限公司') ||
        field.includes('集团有限公司') ||
        field.includes('科技有限公司') ||
        field.includes('股份公司') ||
        field.endsWith('集团')
    );
}

// 判断一个字段是否可能是企业类型
function looksLikeCompanyType(field) {
    return field && (
        field.includes('国有企业') ||
        field.includes('民营企业') ||
        field.includes('外资企业') ||
        field.includes('中外合资') ||
        field.includes('大型企业') ||
        field.includes('中小企业')
    );
}

// 判断一个字段是否可能是地区信息
function looksLikeRegion(field) {
    return field && (
        field.startsWith('总部：') ||
        field.includes('总部：') ||
        field.includes('分公司：')
    );
}

// 将所有字段重新组合成5字段记录
function reconstructRecords(allFields) {
    const headers = allFields.slice(0, 5); // 前5个是表头
    const dataFields = allFields.slice(5);
    const records = [];

    let i = 0;
    while (i < dataFields.length) {
        // 尝试找到企业名称作为记录的开始
        if (looksLikeCompanyName(dataFields[i])) {
            const record = [];

            // 字段1: 企业名称
            record.push(dataFields[i]);
            i++;

            // 字段2: 企业类型
            if (i < dataFields.length && looksLikeCompanyType(dataFields[i])) {
                record.push(dataFields[i]);
                i++;
            } else if (i < dataFields.length) {
                // 如果不是企业类型,可能是合并到名称中了,尝试继续
                record.push('');
            }

            // 字段3: 地区
            if (i < dataFields.length && looksLikeRegion(dataFields[i])) {
                record.push(dataFields[i]);
                i++;
            } else if (i < dataFields.length) {
                record.push('');
            }

            // 字段4: 企业简介(通常很长)
            if (i < dataFields.length && !looksLikeCompanyName(dataFields[i])) {
                record.push(dataFields[i]);
                i++;
            } else if (i < dataFields.length) {
                record.push('');
            }

            // 字段5: 推荐理由(通常也很长)
            if (i < dataFields.length && !looksLikeCompanyName(dataFields[i])) {
                record.push(dataFields[i]);
                i++;
            } else if (i < dataFields.length) {
                record.push('');
            }

            if (record.length === 5) {
                records.push(record);
            }
        } else {
            // 如果这个字段看起来不像企业名称,但包含分公司信息,可能是地区字段
            // 尝试回溯添加到上一条记录
            if (i > 0 && looksLikeRegion(dataFields[i]) && records.length > 0) {
                const lastRecord = records[records.length - 1];
                if (!lastRecord[2]) { // 如果上一条记录没有地区信息
                    lastRecord[2] = dataFields[i];
                } else {
                    // 合并到地区信息
                    lastRecord[2] += '\n' + dataFields[i];
                }
            }
            i++;
        }
    }

    return { headers, records };
}

// 转义CSV字段
function escapeCSVField(field) {
    if (!field) return '';

    // 如果字段包含逗号、引号或换行符,用引号包裹
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
        // 将字段中的引号转义为两个引号
        const escaped = field.replace(/"/g, '""');
        return `"${escaped}"`;
    }
    return field;
}

console.log('正在修复CSV文件...\n');

const csvPath = path.join(__dirname, '..', '公司介绍.csv');
const content = fs.readFileSync(csvPath, 'utf-8');

console.log('步骤1: 解析CSV为原始字段...');
const allFields = parseCSVToRawFields(content);
console.log(`   提取了 ${allFields.length} 个字段\n`);

console.log('步骤2: 重构为5字段记录...');
const { headers, records } = reconstructRecords(allFields);
console.log(`   表头: ${headers.join(', ')}`);
console.log(`   成功重构 ${records.length} 条记录\n`);

console.log('步骤3: 生成修复后的CSV内容...');
const lines = [];

// 添加表头
lines.push(headers.map(escapeCSVField).join(','));

// 添加数据行
records.forEach(record => {
    lines.push(record.map(escapeCSVField).join(','));
});

const fixedContent = lines.join('\n');

// 输出到新文件
const fixedPath = path.join(__dirname, '..', '公司介绍_fixed.csv');
fs.writeFileSync(fixedPath, fixedContent, 'utf-8');

console.log(`✅ 修复完成!`);
console.log(`   原始记录数: ${allFields.length / 5} (理论值)`);
console.log(`   修复后记录数: ${records.length}`);
console.log(`   输出文件: 公司介绍_fixed.csv\n`);

console.log('请检查修复后的文件,如果正确,可以替换原文件。');
