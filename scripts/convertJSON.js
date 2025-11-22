const fs = require('fs');
const path = require('path');

// JSON文件路径
const BASE_DIR = path.join(__dirname, '..');
const COMPANY_JSON = path.join(BASE_DIR, '公司介绍.json');
const IMAGE_JSON = path.join(BASE_DIR, '企业图片.json');
const BUSINESS_JSON = path.join(BASE_DIR, '企业业务板块和内推岗位.json');

// 提取城市信息
function extractCity(region) {
    if (!region) return '';

    // 尝试匹配 "总部：城市名" 的格式
    const match = region.match(/总部[：:]\s*([^\n]+)/);
    if (match) {
        let city = match[1].trim();

        // 移除省份前缀（如果有）
        city = city.replace(/^(江苏|浙江|广东|山东|河北|河南|四川|湖北|湖南|安徽|福建|陕西|辽宁|重庆|天津|上海|北京)\s*/, '');

        // 如果不是以"市"结尾且不是特殊行政区，添加"市"
        if (!city.endsWith('市') && !city.includes('自治') && !city.includes('特别行政区')) {
            city += '市';
        }

        return city;
    }

    return '';
}

console.log('开始读取JSON文件...\n');

// 读取JSON文件
const companyData = JSON.parse(fs.readFileSync(COMPANY_JSON, 'utf-8'));
const imageDataObj = JSON.parse(fs.readFileSync(IMAGE_JSON, 'utf-8'));
const businessDataObj = JSON.parse(fs.readFileSync(BUSINESS_JSON, 'utf-8'));

console.log(`✅ 读取 ${companyData.length} 条公司介绍数据`);
console.log(`✅ 读取 ${Object.keys(imageDataObj).length} 家企业图片数据`);
console.log(`✅ 读取 ${Object.keys(businessDataObj).length} 家企业业务板块数据\n`);

// 建立企业Map，避免重复
const companiesMap = new Map();

companyData.forEach((row) => {
    const name = row['✅企业名称'];
    if (!name) return;

    // 如果企业已存在，跳过
    if (companiesMap.has(name)) return;

    const region = row['✅地区'] || '';
    const city = extractCity(region);
    const type = row['✅企业类型'] || '';
    const description = row['✅企业简介'] || '';

    // 生成企业简称（去掉"有限公司"等后缀）
    const shortName = name
        .replace(/股份有限公司$/, '')
        .replace(/有限责任公司$/, '')
        .replace(/有限公司$/, '')
        .replace(/集团$/, '集团');

    // 生成标签（从企业类型中提取）
    const tags = type.split(',').map(t => t.trim()).filter(t => t);

    // 生成简介（截取前100个字符）
    const intro = description.length > 100 ? description.substring(0, 100) + '...' : description;

    companiesMap.set(name, {
        name: name,
        shortName: shortName,
        type: type,
        tags: tags,
        region: region,
        city: city,
        description: description,
        intro: intro,
        reason: row['✅推荐理由'] || '',  // 前端期望的字段名是 reason
        gallery: [],  // 前端期望的字段名是 gallery
        cover: '',  // 将在合并图片时设置
        segments: []
    });
});

console.log(`✅ 去重后企业数量: ${companiesMap.size}\n`);

// 合并图片数据
Object.keys(imageDataObj).forEach(companyName => {
    if (!companiesMap.has(companyName)) return;

    const company = companiesMap.get(companyName);
    const images = imageDataObj[companyName];

    if (Array.isArray(images)) {
        images.forEach(imageUrl => {
            if (imageUrl && !company.gallery.includes(imageUrl)) {
                company.gallery.push(imageUrl);
            }
        });
        // 设置封面为第一张图片
        if (company.gallery.length > 0) {
            company.cover = company.gallery[0];
        }
    }
});

console.log('✅ 已合并企业图片数据\n');

// 合并业务板块和岗位数据
Object.keys(businessDataObj).forEach(companyName => {
    if (!companiesMap.has(companyName)) return;

    const company = companiesMap.get(companyName);
    const segments = businessDataObj[companyName];

    if (Array.isArray(segments)) {
        segments.forEach(item => {
            const segment = item['业务板块'] || '';
            const positions = item['关联岗位'] || [];

            if (segment || positions.length > 0) {
                company.segments.push({
                    name: segment,  // 前端代码期望name字段
                    jobs: positions  // 前端代码期望jobs字段
                });
            }
        });
    }
});

console.log('✅ 已合并业务板块和岗位数据\n');

// 转换为数组
const companies = Array.from(companiesMap.values());

// 对苏州市的特定企业进行排序调整
// 确保恒力集团和亨通集团排在阿特斯前面
const suzhouPriority = {
    '恒力集团有限公司': 1,
    '亨通集团有限公司': 2,
    '阿特斯阳光电力集团股份有限公司': 3
};

companies.sort((a, b) => {
    // 如果两个都是苏州的优先级企业，按优先级排序
    const aPriority = suzhouPriority[a.name];
    const bPriority = suzhouPriority[b.name];

    if (aPriority && bPriority) {
        return aPriority - bPriority;
    }

    // 如果只有一个是优先级企业，优先级企业排前面
    if (aPriority) return -1;
    if (bPriority) return 1;

    // 其他情况保持原顺序
    return 0;
});

// 统计信息
const cities = new Set();
const provinces = new Set();

companies.forEach(company => {
    if (company.city) {
        cities.add(company.city);

        // 提取省份
        const cityToProv = {
            '苏州市': '江苏省', '南京市': '江苏省', '无锡市': '江苏省', '常州市': '江苏省',
            '南通市': '江苏省', '徐州市': '江苏省', '盐城市': '江苏省', '扬州市': '江苏省',
            '镇江市': '江苏省', '泰州市': '江苏省', '连云港市': '江苏省', '淮安市': '江苏省',
            '宿迁市': '江苏省', '常熟市': '江苏省',

            '杭州市': '浙江省', '宁波市': '浙江省', '温州市': '浙江省', '绍兴市': '浙江省',
            '台州市': '浙江省',

            '广州市': '广东省', '深圳市': '广东省', '东莞市': '广东省', '佛山市': '广东省',
            '惠州市': '广东省', '珠海市': '广东省',

            '合肥市': '安徽省', '芜湖市': '安徽省', '安庆市': '安徽省', '滁州市': '安徽省',
            '池州市': '安徽省', '铜陵市': '安徽省', '六安市': '安徽省',

            '石家庄市': '河北省', '唐山市': '河北省', '保定市': '河北省', '廊坊市': '河北省',
            '衡水市': '河北省',

            '长沙市': '湖南省', '岳阳市': '湖南省', '衡阳市': '湖南省',

            '武汉市': '湖北省',

            '福州市': '福建省', '厦门市': '福建省', '泉州市': '福建省', '莆田市': '福建省',
            '三明市': '福建省',

            '北京市': '北京市',
            '上海市': '上海市',
            '天津市': '天津市'
        };

        const province = cityToProv[company.city];
        if (province) {
            provinces.add(province);
        }
    }
});

console.log('数据统计:');
console.log(`  企业总数: ${companies.length}`);
console.log(`  覆盖城市: ${cities.size}`);
console.log(`  覆盖省份: ${provinces.size}\n`);

console.log('涉及城市列表:');
console.log(Array.from(cities).sort().join(', ') + '\n');

console.log('涉及省份列表:');
console.log(Array.from(provinces).sort().join(', ') + '\n');

// 生成data.js文件
const dataJsContent = `// 自动生成的数据文件
// 生成时间: ${new Date().toLocaleString('zh-CN')}

const companies = ${JSON.stringify(companies, null, 2)};

const cities = ${JSON.stringify(Array.from(cities).sort(), null, 2)};

const provinces = ${JSON.stringify(Array.from(provinces).sort(), null, 2)};

// 为ES6模块导出添加别名
const activeCities = cities;
const activeProvinces = provinces;
const companiesData = companies;

// ES6模块导出
export { companies, cities, provinces, activeCities, activeProvinces, companiesData };

// CommonJS导出（向后兼容）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { companies, cities, provinces, activeCities, activeProvinces, companiesData };
}
`;

const outputPath = path.join(BASE_DIR, 'js', 'data.js');
fs.writeFileSync(outputPath, dataJsContent, 'utf-8');

const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
console.log(`✅ 数据已成功写入: ${outputPath}`);
console.log(`✅ 文件大小: ${fileSize} KB\n`);

// 数据质量检查
const noImage = companies.filter(c => c.gallery.length === 0);
const noSegment = companies.filter(c => c.segments.length === 0);
const noCity = companies.filter(c => !c.city);

console.log('数据质量检查:');
console.log(`  缺少图片的企业: ${noImage.length}`);
console.log(`  缺少业务板块的企业: ${noSegment.length}`);
console.log(`  缺少城市信息的企业: ${noCity.length}\n`);

if (noImage.length > 0 && noImage.length <= 10) {
    console.log('缺少图片的企业:');
    noImage.forEach(c => console.log(`  - ${c.name}`));
    console.log('');
}

if (noSegment.length > 0 && noSegment.length <= 10) {
    console.log('缺少业务板块的企业:');
    noSegment.forEach(c => console.log(`  - ${c.name}`));
    console.log('');
}

if (noCity.length > 0 && noCity.length <= 10) {
    console.log('缺少城市信息的企业:');
    noCity.forEach(c => console.log(`  - ${c.name}`));
    console.log('');
}

console.log('✨ 转换完成！');
