const fs = require('fs');
const path = require('path');

// CSV解析函数
function parseCSV(content) {
    const data = [];
    const skipped = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let headers = null;
    let lineNum = 1;

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
                    // 尝试提取企业名称
                    let companyName = '未知';
                    for (let field of currentRow) {
                        if (field.includes('有限公司') || field.includes('股份') || field.includes('集团')) {
                            // 提取企业名称
                            const match = field.match(/([^,，。；]+?(有限公司|股份有限公司|集团有限公司|科技有限公司))/);
                            if (match) {
                                companyName = match[1];
                                break;
                            }
                        }
                    }

                    skipped.push({
                        lineNum,
                        expectedFields: headers.length,
                        actualFields: currentRow.length,
                        companyName,
                        firstField: currentRow[0] ? currentRow[0].substring(0, 80) : ''
                    });
                }

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
            let companyName = '未知';
            for (let field of currentRow) {
                if (field.includes('有限公司') || field.includes('股份') || field.includes('集团')) {
                    const match = field.match(/([^,，。；]+?(有限公司|股份有限公司|集团有限公司|科技有限公司))/);
                    if (match) {
                        companyName = match[1];
                        break;
                    }
                }
            }
            skipped.push({
                lineNum,
                expectedFields: headers ? headers.length : 0,
                actualFields: currentRow.length,
                companyName,
                firstField: currentRow[0] ? currentRow[0].substring(0, 80) : ''
            });
        }
    }

    return { data, skipped };
}

console.log('正在分析公司介绍.csv文件...\n');

const content = fs.readFileSync(path.join(__dirname, '..', '公司介绍.csv'), 'utf-8');
const result = parseCSV(content);

console.log('========== 解析结果统计 ==========');
console.log(`✅ 成功解析: ${result.data.length} 条记录`);
console.log(`❌ 格式错误被跳过: ${result.skipped.length} 条记录`);
console.log(`📊 总计: ${result.data.length + result.skipped.length} 条\n`);

if (result.skipped.length > 0) {
    console.log('========== 格式错误的记录列表 ==========\n');

    // 按企业名称分组
    const grouped = {};
    result.skipped.forEach(item => {
        if (!grouped[item.companyName]) {
            grouped[item.companyName] = [];
        }
        grouped[item.companyName].push(item);
    });

    Object.keys(grouped).forEach((companyName, index) => {
        const items = grouped[companyName];
        console.log(`${index + 1}. 企业名称: ${companyName}`);
        console.log(`   错误记录数: ${items.length}`);
        console.log(`   期望字段数: 5`);
        console.log(`   实际字段数: ${items[0].actualFields}`);
        console.log(`   首个字段内容: ${items[0].firstField}...`);
        console.log('');
    });

    console.log('\n========== 修复建议 ==========');
    console.log('1. 检查CSV文件中每条企业记录是否有完整的5个字段:');
    console.log('   - ✅企业名称');
    console.log('   - ✅企业类型');
    console.log('   - ✅地区');
    console.log('   - ✅企业简介');
    console.log('   - ✅推荐理由');
    console.log('\n2. 确保每条记录的推荐理由字段末尾有换行符');
    console.log('\n3. 确保所有字段内容如果包含逗号、引号或换行符，必须用双引号包裹');
    console.log('\n4. 特别检查上述列表中的企业记录');
}

// 输出缺少的企业名单
console.log('\n========== 特别关注 ==========');
console.log('以下企业应该在CSV中但未被成功解析:');
console.log('- 江苏恒瑞医药股份有限公司');
console.log('- 宿迁阿特斯阳光能源科技有限公司');
console.log('\n建议: 检查这些企业所在行的前一条记录是否缺少换行符');
