const fs = require('fs');

// 需要查找的企业列表
const targetCompanies = [
    "恒力集团有限公司", "亨通集团有限公司", "盛虹控股集团有限公司", "江苏沙钢集团有限公司",
    "协鑫集团有限公司", "无锡产业发展集团有限公司", "江苏银行股份有限公司", "中天钢铁集团有限公司",
    "海澜集团有限公司", "永卓控股有限公司", "江苏新长江实业集团有限公司", "苏美达股份有限公司",
    "天合光能股份有限公司", "江苏省苏亲控股集团有限公司", "江阴兴澄特种钢铁有限公司",
    "江苏交通控股有限公司", "徐州工程机械集团有限公司", "江苏悦达集团有限公司",
    "中天科技集团有限公司", "南京银行股份有限公司", "汇通达网络股份有限公司",
    "立铠精密科技(盐城)有限公司", "远景能源有限公司", "三房巷集团有限公司", "红豆集团有限公司",
    "东方润安集团有限公司", "扬子江药业集团有限公司", "弘阳集团有限公司",
    "江苏国泰国际集团股份有限公司", "南京新工投资集团有限责任公司", "南通四建集团有限公司",
    "苏宁易购集团股份有限公司", "江苏满运软件科技有限公司", "双良集团有限公司",
    "通鼎集团有限公司", "宝胜集团有限公司", "龙信建设集团有限公司", "江苏阳光集团有限公司",
    "远东控股集团有限公司", "通州建总集团有限公司", "江苏华西集团有限公司", "攀华集团有限公司",
    "江苏华宏实业集团有限公司", "徐州矿务集团有限公司", "阿特斯阳光电力集团股份有限公司",
    "江苏大明工业科技集团有限公司", "江苏省华建建设股份有限公司", "法尔胜泓具集团有限公司",
    "江苏金峰水泥集团有限公司", "江苏天工新材料科技集团有限公司", "大全集团有限公司",
    "中新钢铁集团有限公司", "江苏江润铜业有限公司", "常熟市龙腾特种钢有限公司",
    "波司登股份有限公司", "永鼎集团有限公司", "中亿丰控股集团有限公司", "江苏三木集团有限公司",
    "南通化工轻工股份有限公司", "大亚科技集团有限公司", "江苏沃得机电集团有限公司",
    "江苏江都建设集团有限公司", "江苏省镇鑫钢铁集团有限公司", "江苏联鑫控股集团有限公司",
    "雅迪科技集团有限公司", "江苏新霖飞投资有限公司", "红太阳集团有限公司", "华芳集团有限公司",
    "中国核工业华兴建设有限公司", "苏州东山精密制造股份有限公司", "江苏无锡朝阳集团股份有限公司",
    "苏州金螳螂企业(集团)有限公司", "江阴长三角钢铁集团有限公司", "江苏上上电缆集团有限公司",
    "兴达投资集团有限公司", "江苏新海石化有限公司", "南通五建控股集团有限公司",
    "江苏中超投资集团有限公司", "江阴江东集团公司", "江苏华地国际控股集团有限公司",
    "苏州创元投资发展(集团)有限公司", "江苏江中集团有限公司", "南京新华海科技产业集团有限公司",
    "无锡江南电缆有限公司", "江苏长电科技股份有限公司", "新阳科技集团有限公司",
    "江苏扬子江船业集团有限公司", "江阴市金桥化工有限公司", "江苏飞达控股集团有限公司",
    "中煤能源南京有限公司", "金东纸业(江苏)股份有限公司", "东华能源股份有限公司",
    "无锡市交通产业集团有限公司", "无锡市国联发展(集团)有限公司", "天合富家能源股份有限公司"
];

// 企业名称到搜索关键词的映射
const keywordMap = {
    "恒力集团有限公司": ["恒力HENGLI", "恒力"],
    "亨通集团有限公司": ["亨通光电HTGD", "亨通"],
    "盛虹控股集团有限公司": ["盛虹"],
    "江苏沙钢集团有限公司": ["沙钢SHAGANG", "沙钢"],
    "协鑫集团有限公司": ["协鑫GCL", "协鑫科技", "协鑫能科"],
    "江苏银行股份有限公司": ["江苏银行"],
    "中天钢铁集团有限公司": ["中天钢铁ZENITH"],
    "海澜集团有限公司": ["海澜之家HLA"],
    "天合光能股份有限公司": ["天合光能Trinasolar"],
    "徐州工程机械集团有限公司": ["徐工XCMG"],
    "中天科技集团有限公司": ["中天科技ZTT", "中天科技"],
    "南京银行股份有限公司": ["南京银行"],
    "汇通达网络股份有限公司": ["汇通达HUITONGDA"],
    "三房巷集团有限公司": ["三房巷"],
    "红豆集团有限公司": ["红豆Hodo", "红豆居家Hodo"],
    "弘阳集团有限公司": ["弘阳RSUN"],
    "苏宁易购集团股份有限公司": ["苏宁易购SUNING"],
    "双良集团有限公司": ["双良集团"],
    "通鼎集团有限公司": ["通鼎互联"],
    "攀华集团有限公司": ["攀华PANHUA"],
    "波司登股份有限公司": ["波司登"],
    "永鼎集团有限公司": ["永鼎股份"],
    "江苏三木集团有限公司": ["三木集团"],
    "雅迪科技集团有限公司": ["雅迪电动车"],
    "红太阳集团有限公司": ["红太阳RED SUN", "红太阳新能源"],
    "华芳集团有限公司": ["华芳"],
    "苏州金螳螂企业(集团)有限公司": ["金螳螂GOLDMANTiS", "金螳螂·家"],
    "江苏上上电缆集团有限公司": ["上上电缆"],
    "无锡江南电缆有限公司": ["江南电缆"],
    "天合富家能源股份有限公司": ["天合富家"]
};

// 读取 JSON 数据
const jsonData = JSON.parse(fs.readFileSync('ddcz_entinfo.json', 'utf-8'));

// 提取匹配的 logo
const foundLogos = new Map();

jsonData.forEach(item => {
    for (const [company, keywords] of Object.entries(keywordMap)) {
        if (!foundLogos.has(company)) {
            for (const keyword of keywords) {
                if (item.ent_brand === keyword || item.ent_brand.includes(keyword)) {
                    foundLogos.set(company, {
                        n: item.ent_brand,
                        u: item.logo_url
                    });
                    break;
                }
            }
        }
    }
});

console.log(`\n找到 ${foundLogos.size} 个匹配的企业logo:\n`);
foundLogos.forEach((logo, company) => {
    console.log(`✅ ${company} -> ${logo.n}`);
});

// 读取 6.html
const html = fs.readFileSync('6.html', 'utf-8');

// 提取现有的 rawData 数组
const rawDataMatch = html.match(/const rawData = \[([\s\S]*?)\];/);
if (!rawDataMatch) {
    console.error('未找到 rawData 数组');
    process.exit(1);
}

// 解析现有的 logo 数据
const existingLogosStr = rawDataMatch[1];
const existingLogos = [];
const logoRegex = /\{"n":"([^"]+)","u":"([^"]+)"\}/g;
let match;
while ((match = logoRegex.exec(existingLogosStr)) !== null) {
    existingLogos.push({ n: match[1], u: match[2] });
}

console.log(`\n现有 logo 数量: ${existingLogos.length}`);

// 创建新的 logo 列表
const newLogos = [];
const usedNames = new Set();

// 首先添加找到的目标企业 logo
foundLogos.forEach((logo) => {
    if (!usedNames.has(logo.n)) {
        newLogos.push(logo);
        usedNames.add(logo.n);
    }
});

console.log(`\n添加目标企业 logo: ${newLogos.length} 个`);

// 然后从现有 logo 中填充
for (const logo of existingLogos) {
    if (newLogos.length >= 200) break;
    if (!usedNames.has(logo.n)) {
        newLogos.push(logo);
        usedNames.add(logo.n);
    }
}

console.log(`\n从现有logo填充后: ${newLogos.length} 个`);

// 如果还不够200个，从JSON数据中补充更多
if (newLogos.length < 200) {
    for (const item of jsonData) {
        if (newLogos.length >= 200) break;
        if (item.logo_url && item.ent_brand && !usedNames.has(item.ent_brand)) {
            newLogos.push({ n: item.ent_brand, u: item.logo_url });
            usedNames.add(item.ent_brand);
        }
    }
}

console.log(`\n最终 logo 数量: ${newLogos.length}`);

// 生成新的 rawData 字符串
const newRawDataStr = newLogos.map(logo =>
    `          {"n":"${logo.n}","u":"${logo.u}"}`
).join(',\n');

// 替换 HTML 中的 rawData
const newHtml = html.replace(
    /const rawData = \[[\s\S]*?\];/,
    `const rawData = [\n${newRawDataStr}\n        ];`
);

// 写回文件
fs.writeFileSync('6.html', newHtml, 'utf-8');

console.log('\n✅ 6.html 已更新！');
