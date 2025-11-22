const fs = require('fs');
const path = require('path');

// CSV文件路径
const BASE_DIR = path.join(__dirname, '..');
const COMPANY_CSV = path.join(BASE_DIR, '公司介绍.csv');
const IMAGE_CSV = path.join(BASE_DIR, '企业图片.csv');
const BUSINESS_CSV = path.join(BASE_DIR, '企业业务板块和内推岗位.csv');

// CSV解析函数
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

function extractCity(region) {
    if (!region) return '';
    const match = region.match(/总部[：:]\s*([^  \n]+)/);
    if (match) {
        let city = match[1].trim();
        city = city.replace(/^(江苏|浙江|广东|山东|河北|河南|四川|湖北|湖南|安徽|福建|陕西|辽宁)\s*/, '');
        if (!city.endsWith('市') && !city.includes('自治') && !city.includes('特别行政区')) {
            city += '市';
        }
        return city;
    }
    return '';
}

console.log('读取CSV文件...\n');

const companyData = parseCSV(fs.readFileSync(COMPANY_CSV, 'utf-8'));
const imageData = parseCSV(fs.readFileSync(IMAGE_CSV, 'utf-8'));
const businessData = parseCSV(fs.readFileSync(BUSINESS_CSV, 'utf-8'));

console.log(`✅ 读取 ${companyData.length} 条公司介绍数据`);
console.log(`✅ 读取 ${imageData.length} 条企业图片数据`);
console.log(`✅ 读取 ${businessData.length} 条业务板块数据\n`);

// 建立企业Map
const companiesMap = new Map();

companyData.forEach((row) => {
    const name = row['企业名称'] || row['✅企业名称'];
    if (!name) return;

    if (companiesMap.has(name)) return;

    const region = row['地区'] || row['✅地区'] || '';
    const city = extractCity(region);

    companiesMap.set(name, {
        name: name,
        city: city,
        hasImage: false,
        hasSegment: false
    });
});

// 标记有图片的企业
imageData.forEach(row => {
    const name = row['企业名称'];
    if (name && companiesMap.has(name)) {
        companiesMap.get(name).hasImage = true;
    }
});

// 标记有业务板块的企业
businessData.forEach(row => {
    const name = row['企业名称'] || row['✅企业名称'];
    if (name && companiesMap.has(name)) {
        companiesMap.get(name).hasSegment = true;
    }
});

// 检查缺失数据
const noImage = [];
const noSegment = [];
const noCity = [];

companiesMap.forEach((company, name) => {
    if (!company.hasImage) noImage.push(name);
    if (!company.hasSegment) noSegment.push(name);
    if (!company.city) noCity.push(name);
});

console.log('========== 数据质量检查结果 ==========\n');

if (noImage.length > 0) {
    console.log(`❌ 缺少图片的企业 (${noImage.length}家):`);
    noImage.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });
    console.log('');
}

if (noSegment.length > 0) {
    console.log(`❌ 缺少业务板块的企业 (${noSegment.length}家):`);
    noSegment.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });
    console.log('');
}

if (noCity.length > 0) {
    console.log(`❌ 缺少城市信息的企业 (${noCity.length}家):`);
    noCity.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });
    console.log('');
}

if (noImage.length === 0 && noSegment.length === 0 && noCity.length === 0) {
    console.log('✅ 所有企业数据完整！');
}
