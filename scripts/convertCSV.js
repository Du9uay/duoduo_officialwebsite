#!/usr/bin/env node

/**
 * CSV数据转换脚本
 * 将三个CSV文件合并转换为JavaScript数据格式
 */

const fs = require('fs');
const path = require('path');

// CSV文件路径
const BASE_DIR = path.join(__dirname, '..');
const COMPANY_CSV = path.join(BASE_DIR, '公司介绍.csv');
const IMAGE_CSV = path.join(BASE_DIR, '企业图片.csv');
const BUSINESS_CSV = path.join(BASE_DIR, '企业业务板块和内推岗位.csv');
const OUTPUT_FILE = path.join(BASE_DIR, 'js', 'data.js');

/**
 * 更强大的CSV解析函数
 * 处理带引号的字段、逗号分隔和字段内换行符
 */
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
                // 双引号转义
                currentField += '"';
                i++;
            } else {
                // 切换引号状态
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 字段分隔符
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // 行结束（不在引号内）
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());

                if (!headers) {
                    // 第一行是标题
                    headers = currentRow;
                } else if (currentRow.length === headers.length) {
                    // 只有当字段数量匹配时才添加
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = currentRow[index];
                    });
                    data.push(row);
                }

                currentRow = [];
                currentField = '';
            }
            // 跳过 \r\n 的第二个字符
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
            const row = {};
            headers.forEach((header, index) => {
                row[header] = currentRow[index];
            });
            data.push(row);
        }
    }

    return data;
}

/**
 * 从地区字段提取总部城市
 * 例如："总部：苏州市  分公司：大连市" → "苏州市"
 */
function extractCity(region) {
    if (!region) return '';

    // 匹配"总部：XX市"或"总部：XX"
    const match = region.match(/总部[：:]\s*([^  \n]+)/);
    if (match) {
        let city = match[1].trim();

        // 移除省份前缀（如"江苏无锡市" → "无锡市"）
        city = city.replace(/^(江苏|浙江|广东|山东|河北|河南|四川|湖北|湖南|安徽|福建|陕西|辽宁)\s*/, '');

        // 确保城市名以"市"结尾
        if (!city.endsWith('市') && !city.includes('自治') && !city.includes('特别行政区')) {
            city += '市';
        }
        return city;
    }

    return '';
}

/**
 * 生成企业简称
 * 保留完整的企业名称，只移除常见后缀
 */
function generateShortName(fullName) {
    if (!fullName) return '';

    // 移除常见后缀，但保留企业核心名称
    let name = fullName
        .replace(/有限责任公司$/, '')
        .replace(/股份有限公司$/, '')
        .replace(/有限公司$/, '')
        .replace(/\(集团\)$/, '')
        .replace(/（集团）$/, '')
        .trim();

    // 保留完整名称，不再截断
    return name || fullName;
}

/**
 * 生成拼音ID（简化版）
 */
function generateId(name, index) {
    // 简单使用索引作为ID
    return `company${String(index + 1).padStart(3, '0')}`;
}

/**
 * 处理标签
 * "民营企业, 大型企业" → ["民营企业", "大型企业"]
 */
function processTags(tagString) {
    if (!tagString) return [];
    return tagString.split(',').map(t => t.trim()).filter(t => t);
}

/**
 * 城市到省份的映射
 */
const cityToProvince = {
    // 江苏省
    '南京市': '江苏省', '苏州市': '江苏省', '无锡市': '江苏省', '常州市': '江苏省',
    '徐州市': '江苏省', '南通市': '江苏省', '连云港市': '江苏省', '淮安市': '江苏省',
    '盐城市': '江苏省', '扬州市': '江苏省', '镇江市': '江苏省', '泰州市': '江苏省',
    '宿迁市': '江苏省',

    // 浙江省
    '杭州市': '浙江省', '宁波市': '浙江省', '温州市': '浙江省', '嘉兴市': '浙江省',
    '湖州市': '浙江省', '绍兴市': '浙江省', '金华市': '浙江省', '衢州市': '浙江省',
    '舟山市': '浙江省', '台州市': '浙江省', '丽水市': '浙江省',

    // 广东省
    '广州市': '广东省', '深圳市': '广东省', '珠海市': '广东省', '汕头市': '广东省',
    '佛山市': '广东省', '韶关市': '广东省', '湛江市': '广东省', '肇庆市': '广东省',
    '江门市': '广东省', '茂名市': '广东省', '惠州市': '广东省', '梅州市': '广东省',
    '汕尾市': '广东省', '河源市': '广东省', '阳江市': '广东省', '清远市': '广东省',
    '东莞市': '广东省', '中山市': '广东省', '潮州市': '广东省', '揭阳市': '广东省',
    '云浮市': '广东省',

    // 上海、北京、天津、重庆（直辖市）
    '上海市': '上海市', '北京市': '北京市', '天津市': '天津市', '重庆市': '重庆市',

    // 山东省
    '济南市': '山东省', '青岛市': '山东省', '淄博市': '山东省', '枣庄市': '山东省',
    '东营市': '山东省', '烟台市': '山东省', '潍坊市': '山东省', '济宁市': '山东省',
    '泰安市': '山东省', '威海市': '山东省', '日照市': '山东省', '临沂市': '山东省',
    '德州市': '山东省', '聊城市': '山东省', '滨州市': '山东省', '菏泽市': '山东省',

    // 四川省
    '成都市': '四川省', '自贡市': '四川省', '攀枝花市': '四川省', '泸州市': '四川省',
    '德阳市': '四川省', '绵阳市': '四川省', '广元市': '四川省', '遂宁市': '四川省',
    '内江市': '四川省', '乐山市': '四川省', '南充市': '四川省', '眉山市': '四川省',
    '宜宾市': '四川省', '广安市': '四川省', '达州市': '四川省', '雅安市': '四川省',
    '巴中市': '四川省', '资阳市': '四川省',

    // 安徽省
    '合肥市': '安徽省', '芜湖市': '安徽省', '蚌埠市': '安徽省', '淮南市': '安徽省',
    '马鞍山市': '安徽省', '淮北市': '安徽省', '铜陵市': '安徽省', '安庆市': '安徽省',
    '黄山市': '安徽省', '滁州市': '安徽省', '阜阳市': '安徽省', '宿州市': '安徽省',
    '六安市': '安徽省', '亳州市': '安徽省', '池州市': '安徽省', '宣城市': '安徽省',

    // 河北省
    '石家庄市': '河北省', '唐山市': '河北省', '秦皇岛市': '河北省', '邯郸市': '河北省',
    '邢台市': '河北省', '保定市': '河北省', '张家口市': '河北省', '承德市': '河北省',
    '沧州市': '河北省', '廊坊市': '河北省', '衡水市': '河北省',

    // 湖北省
    '武汉市': '湖北省', '黄石市': '湖北省', '十堰市': '湖北省', '宜昌市': '湖北省',
    '襄阳市': '湖北省', '鄂州市': '湖北省', '荆门市': '湖北省', '孝感市': '湖北省',
    '荆州市': '湖北省', '黄冈市': '湖北省', '咸宁市': '湖北省', '随州市': '湖北省',

    // 湖南省
    '长沙市': '湖南省', '株洲市': '湖南省', '湘潭市': '湖南省', '衡阳市': '湖南省',
    '邵阳市': '湖南省', '岳阳市': '湖南省', '常德市': '湖南省', '张家界市': '湖南省',
    '益阳市': '湖南省', '郴州市': '湖南省', '永州市': '湖南省', '怀化市': '湖南省',
    '娄底市': '湖南省',

    // 福建省
    '福州市': '福建省', '厦门市': '福建省', '莆田市': '福建省', '三明市': '福建省',
    '泉州市': '福建省', '漳州市': '福建省', '南平市': '福建省', '龙岩市': '福建省',
    '宁德市': '福建省',

    // 河南省
    '郑州市': '河南省', '开封市': '河南省', '洛阳市': '河南省', '平顶山市': '河南省',
    '安阳市': '河南省', '鹤壁市': '河南省', '新乡市': '河南省', '焦作市': '河南省',
    '濮阳市': '河南省', '许昌市': '河南省', '漯河市': '河南省', '三门峡市': '河南省',
    '南阳市': '河南省', '商丘市': '河南省', '信阳市': '河南省', '周口市': '河南省',
    '驻马店市': '河南省',

    // 陕西省
    '西安市': '陕西省', '铜川市': '陕西省', '宝鸡市': '陕西省', '咸阳市': '陕西省',
    '渭南市': '陕西省', '延安市': '陕西省', '汉中市': '陕西省', '榆林市': '陕西省',
    '安康市': '陕西省', '商洛市': '陕西省',

    // 辽宁省
    '沈阳市': '辽宁省', '大连市': '辽宁省', '鞍山市': '辽宁省', '抚顺市': '辽宁省',
    '本溪市': '辽宁省', '丹东市': '辽宁省', '锦州市': '辽宁省', '营口市': '辽宁省',
    '阜新市': '辽宁省', '辽阳市': '辽宁省', '盘锦市': '辽宁省', '铁岭市': '辽宁省',
    '朝阳市': '辽宁省', '葫芦岛市': '辽宁省',

    // 可以继续添加其他省份...
};

console.log('开始读取CSV文件...\n');

// 读取三个CSV文件
const companyData = parseCSV(fs.readFileSync(COMPANY_CSV, 'utf-8'));
const imageData = parseCSV(fs.readFileSync(IMAGE_CSV, 'utf-8'));
const businessData = parseCSV(fs.readFileSync(BUSINESS_CSV, 'utf-8'));

console.log(`✅ 读取 ${companyData.length} 条公司介绍数据`);
console.log(`✅ 读取 ${imageData.length} 条企业图片数据`);
console.log(`✅ 读取 ${businessData.length} 条业务板块数据\n`);

// 以企业名称为键，去重并合并数据
const companiesMap = new Map();
const citySet = new Set();
const provinceSet = new Set();

// 第一步：处理公司基本信息（去重）
companyData.forEach((row, index) => {
    const name = row['企业名称'] || row['✅企业名称'];
    if (!name) return;

    // 如果企业已存在，跳过（第一次出现的为准）
    if (companiesMap.has(name)) return;

    const region = row['地区'] || row['✅地区'] || '';
    const city = extractCity(region);

    if (city) {
        citySet.add(city);
        const province = cityToProvince[city];
        if (province) {
            provinceSet.add(province);
        }
    }

    companiesMap.set(name, {
        id: generateId(name, companiesMap.size),
        city: city,
        name: name,
        shortName: generateShortName(name),
        tags: processTags(row['企业类型'] || row['✅企业类型'] || ''),
        intro: row['企业简介'] || row['✅企业简介'] || '',
        reason: row['推荐理由'] || row['✅推荐理由'] || '',
        region: region,
        cover: '',
        gallery: [],
        segments: []
    });
});

console.log(`✅ 去重后企业数量: ${companiesMap.size}\n`);

// 第二步：合并企业图片
imageData.forEach(row => {
    const name = row['企业名称'];
    const imagePath = row['图片路径'];

    if (name && imagePath && companiesMap.has(name)) {
        const company = companiesMap.get(name);
        company.gallery.push(imagePath);

        // 第一张图片作为封面
        if (!company.cover) {
            company.cover = imagePath;
        }
    }
});

console.log(`✅ 已合并企业图片数据\n`);

// 第三步：合并业务板块和岗位
businessData.forEach(row => {
    const name = row['企业名称'] || row['✅企业名称'];
    const segmentName = row['业务板块/主要业务'] || row['✅业务板块/主要业务'] || '';
    const jobsString = row['关联岗位'] || row['✅关联岗位'] || '';

    if (name && segmentName && companiesMap.has(name)) {
        const company = companiesMap.get(name);

        // 岗位按逗号分割
        const jobs = jobsString.split(',').map(j => j.trim()).filter(j => j);

        company.segments.push({
            name: segmentName,
            jobs: jobs
        });
    }
});

console.log(`✅ 已合并业务板块和岗位数据\n`);

// 转换为数组
const companiesArray = Array.from(companiesMap.values());

// 按城市排序
companiesArray.sort((a, b) => a.city.localeCompare(b.city, 'zh-CN'));

console.log('数据统计:');
console.log(`  企业总数: ${companiesArray.length}`);
console.log(`  覆盖城市: ${citySet.size}`);
console.log(`  覆盖省份: ${provinceSet.size}\n`);

// 输出城市列表（用于config.js）
console.log('涉及城市列表:');
const citiesArray = Array.from(citySet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
console.log(citiesArray.join(', '));
console.log('');

// 输出省份列表（用于config.js）
console.log('涉及省份列表:');
const provincesArray = Array.from(provinceSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
console.log(provincesArray.join(', '));
console.log('');

// 生成JavaScript文件
const jsContent = `/* ===================================
   企业数据 - 从CSV自动生成
   生成时间: ${new Date().toLocaleString('zh-CN')}
   企业数量: ${companiesArray.length}
   =================================== */

export const companiesData = ${JSON.stringify(companiesArray, null, 4)};

// 城市列表 (共${citiesArray.length}个)
export const activeCities = ${JSON.stringify(citiesArray, null, 4)};

// 省份列表 (共${provincesArray.length}个)
export const activeProvinces = ${JSON.stringify(provincesArray, null, 4)};
`;

// 写入文件
fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');

console.log(`✅ 数据已成功写入: ${OUTPUT_FILE}`);
console.log(`✅ 文件大小: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB\n`);

// 数据质量检查
let noImageCount = 0;
let noSegmentCount = 0;
let noCityCount = 0;

companiesArray.forEach(company => {
    if (company.gallery.length === 0) noImageCount++;
    if (company.segments.length === 0) noSegmentCount++;
    if (!company.city) noCityCount++;
});

console.log('数据质量检查:');
console.log(`  缺少图片的企业: ${noImageCount}`);
console.log(`  缺少业务板块的企业: ${noSegmentCount}`);
console.log(`  缺少城市信息的企业: ${noCityCount}`);

console.log('\n✨ 转换完成！');
