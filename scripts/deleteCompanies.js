const fs = require('fs');
const path = require('path');

// 要删除的企业列表
const companiesToDelete = [
    '福建省长乐市金磊纺织有限公司',
    '福建顺大运动品有限公司',
    '福建鑫海冶金有限公司',
    '河北财商商贸有限公司',
    '湖南德元顺生物科技有限公司',
    '湖南福陆特科技发展有限公司',
    '湖南航祥机电科技有限公司',
    '湖南中邦恒盛医药有限公司',
    '石家庄北国人百集团有限责任公司',
    '皙悦（天津）文旅产业发展有限公司'
];

// CSV文件路径
const files = [
    '../公司介绍.csv',
    '../企业业务板块和内推岗位.csv',
    '../企业图片.csv'
];

// 简单的CSV解析函数（处理带引号的字段）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // 转义的引号
                current += '"';
                i++;
            } else {
                // 切换引号状态
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 字段分隔符
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

// 处理每个文件
files.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ 文件不存在: ${file}`);
        return;
    }

    console.log(`\n📄 处理文件: ${file}`);

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 保留第一行（表头）
    const header = lines[0];
    const dataLines = lines.slice(1);

    // 过滤掉要删除的企业
    const filteredLines = [];
    let deletedCount = 0;

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue; // 跳过空行

        // 解析CSV行
        const fields = parseCSVLine(line);
        const companyName = fields[0]; // 第一列是企业名称

        // 检查是否需要删除
        if (companiesToDelete.includes(companyName)) {
            console.log(`  ❌ 删除: ${companyName}`);
            deletedCount++;
        } else {
            filteredLines.push(line);
        }
    }

    // 写回文件
    const newContent = [header, ...filteredLines].join('\n');
    fs.writeFileSync(filePath, newContent, 'utf-8');

    console.log(`  ✅ 完成: 删除了 ${deletedCount} 家企业`);
});

console.log('\n\n🎉 所有文件处理完成！');
