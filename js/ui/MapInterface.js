/* ===================================
   地图界面控制器 - 使用ECharts渲染中国地图
   =================================== */

import { CONFIG } from '../config.js';

// 省份名称到地图配置的映射
const PROVINCE_MAP = {
    '江苏省': { key: 'jiangsu', code: '320000', name: '江苏省' },
    '浙江省': { key: 'zhejiang', code: '330000', name: '浙江省' },
    '广东省': { key: 'guangdong', code: '440000', name: '广东省' },
    '山东省': { key: 'shandong', code: '370000', name: '山东省' },
    '河北省': { key: 'hebei', code: '130000', name: '河北省' },
    '河南省': { key: 'henan', code: '410000', name: '河南省' },
    '四川省': { key: 'sichuan', code: '510000', name: '四川省' },
    '湖北省': { key: 'hubei', code: '420000', name: '湖北省' },
    '湖南省': { key: 'hunan', code: '430000', name: '湖南省' },
    '安徽省': { key: 'anhui', code: '340000', name: '安徽省' },
    '福建省': { key: 'fujian', code: '350000', name: '福建省' },
    '陕西省': { key: 'shaanxi', code: '610000', name: '陕西省' },
    '辽宁省': { key: 'liaoning', code: '210000', name: '辽宁省' },
    '北京市': { key: 'beijing', code: '110000', name: '北京市' },
    '上海市': { key: 'shanghai', code: '310000', name: '上海市' },
    '天津市': { key: 'tianjin', code: '120000', name: '天津市' },
    '重庆市': { key: 'chongqing', code: '500000', name: '重庆市' }
};

export class MapInterface {
    constructor(container, onCityClick) {
        this.container = container;
        this.onCityClick = onCityClick;
        this.myChart = null;
        this.currentRegion = 'china';
        this.currentProvinceName = '';  // 当前省份名称
    }

    // 初始化地图
    async init(regionName = 'china', provinceName = '') {
        this.currentRegion = regionName;
        this.currentProvinceName = provinceName;

        // 直辖市特殊处理：不加载省级地图，直接显示企业列表
        const municipalities = ['北京市', '上海市', '天津市', '重庆市'];
        if (regionName === 'province' && municipalities.includes(provinceName)) {
            console.log(`直辖市 ${provinceName}，跳过省级地图，直接显示企业列表`);
            // 直接调用城市点击回调
            if (this.onCityClick) {
                this.onCityClick(provinceName);
            }
            return; // 终止地图加载
        }

        // 如果已有实例，先销毁
        if (this.myChart) {
            this.myChart.dispose();
        }

        // 创建图表实例
        const chartDom = document.getElementById('map-chart');
        if (!chartDom) {
            console.error('地图容器元素不存在');
            return;
        }

        this.myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            width: window.innerWidth,
            height: window.innerHeight - 64  // 减去导航栏高度
        });

        // 显示加载动画
        this.myChart.showLoading({
            text: CONFIG.echarts.loadingText,
            color: CONFIG.echarts.loadingColor,
            textColor: CONFIG.echarts.loadingTextColor,
            maskColor: CONFIG.echarts.loadingMaskColor
        });

        // 确定地图配置
        const mapConfig = CONFIG.map;
        const isProvince = (regionName !== 'china');
        let geoJsonUrl = '';

        if (regionName === 'china') {
            // 全国地图
            geoJsonUrl = mapConfig.geoJsonUrls.china;
            document.getElementById('breadcrumb-container').classList.add('hidden');
            document.getElementById('top-region-name').innerText = '全国';
        } else {
            // 省级地图 - 动态加载
            const provinceInfo = PROVINCE_MAP[provinceName];
            if (provinceInfo) {
                // 优先使用config中配置的URL，否则使用动态生成的URL
                geoJsonUrl = mapConfig.geoJsonUrls[provinceInfo.key] ||
                            `https://geo.datav.aliyun.com/areas_v3/bound/${provinceInfo.code}_full.json`;

                // 更新面包屑和顶部区域名称
                const breadcrumb = document.getElementById('breadcrumb-container');
                if (breadcrumb) {
                    breadcrumb.innerHTML = `
                        <span class="hover:text-white cursor-pointer transition" onclick="window.resetMapToChina()">全国</span>
                        <span class="mx-2 text-gray-600">/</span>
                        <span class="text-cyan-400 font-bold">${provinceInfo.name}</span>
                    `;
                    breadcrumb.classList.remove('hidden');
                }
                document.getElementById('top-region-name').innerText = provinceInfo.name;
            } else {
                console.error(`未找到省份 "${provinceName}" 的配置`);
                return;
            }
        }

        try {
            // 获取GeoJSON数据
            const res = await fetch(geoJsonUrl);

            // 检查响应状态，防止404导致JSON解析报错
            if (!res.ok) {
                throw new Error(`地图数据请求失败: ${res.status} ${res.statusText}`);
            }

            const geoJson = await res.json();
            this.myChart.hideLoading();

            // 注册地图
            echarts.registerMap(regionName, geoJson);

            // 调试：输出应该高亮的省份/城市
            if (!isProvince) {
                console.log('=== 全国地图应该高亮的省份 ===');
                console.log(mapConfig.activeProvinces);
            } else {
                console.log('=== 省级地图应该高亮的城市 ===');
                console.log(mapConfig.activeCities);
            }

            // 调试：输出地图返回的所有区域名称
            console.log('=== 地图GeoJSON返回的区域名称 ===');
            console.log(geoJson.features.map(f => f.properties.name));

            // 生成数据列表（高亮有数据的省份/城市）
            const dataList = geoJson.features.map(feature => {
                const name = feature.properties.name;

                let hasData = false;
                if (isProvince) {
                    // 省级地图 - 检查城市是否有数据
                    // 处理城市名称格式：地图可能返回"苏州"，数据中是"苏州市"
                    let cityName = name;
                    if (!cityName.endsWith('市') && !cityName.includes('自治') && !cityName.includes('地区')) {
                        cityName += '市';
                    }
                    hasData = mapConfig.activeCities.includes(cityName);
                    if (hasData) {
                        console.log(`✅ 高亮城市: ${name} (处理后: ${cityName})`);
                    }
                } else {
                    // 全国地图 - 检查省份是否有数据
                    hasData = mapConfig.activeProvinces.includes(name);
                    if (hasData) {
                        console.log(`✅ 高亮省份: ${name}`);
                    }
                }

                return {
                    name: name,
                    itemStyle: {
                        // 有数据的区域：金黄色高亮
                        areaColor: hasData ? 'rgba(251, 191, 36, 0.35)' : 'rgba(11, 16, 38, 0.8)',
                        borderColor: hasData ? '#fbbf24' : '#1e293b',
                        borderWidth: hasData ? 2 : 0.5
                    },
                    emphasis: {
                        itemStyle: {
                            // 鼠标悬停：更亮的金黄色
                            areaColor: hasData ? 'rgba(251, 191, 36, 0.6)' : 'rgba(30, 41, 59, 0.9)'
                        },
                        label: {
                            color: hasData ? '#fff' : '#94a3b8',
                            fontWeight: hasData ? 'bold' : 'normal'
                        }
                    },
                    disabled: !hasData
                };
            });

            // 配置地图选项
            const isMobile = window.innerWidth < 768;
            this.myChart.setOption({
                geo: {
                    map: regionName,
                    roam: true,
                    zoom: isMobile ? 1.3 : mapConfig.defaultZoom,  // 移动端适配缩放
                    scaleLimit: {
                        min: isMobile ? 1.0 : 0.8,   // 移动端最小100%，PC端80%
                        max: isMobile ? 2.0 : 2.5    // 移动端最大200%，PC端250%
                    },
                    label: {
                        show: true,
                        color: '#94a3b8',
                        fontSize: isMobile ? 8 : 10  // 移动端使用更小字体
                    },
                    itemStyle: {
                        areaColor: '#0f172a',
                        borderColor: '#1e293b'
                    },
                    select: { disabled: true }
                },
                series: [{
                    type: 'map',
                    geoIndex: 0,
                    data: dataList
                }]
            });

            // 核心修复：立即强制重绘，解决移动端白屏问题
            this.myChart.resize();

            // 绑定点击事件
            this.myChart.on('click', params => {
                if (params.data && params.data.disabled) return;

                console.log('地图点击:', params.name, '当前层级:', isProvince ? '省级' : '全国');

                if (!isProvince) {
                    // 全国地图 - 点击省份
                    const clickedProvince = params.name;
                    console.log('🗺️ 全国地图点击事件触发');
                    console.log('点击省份:', clickedProvince, '是否有数据:', mapConfig.activeProvinces.includes(clickedProvince));

                    // 直辖市列表 - 直接显示企业列表，不进入省级地图
                    const municipalities = ['北京市', '上海市', '天津市', '重庆市'];

                    console.log('🔍 检查是否为直辖市:', municipalities.includes(clickedProvince));

                    if (municipalities.includes(clickedProvince)) {
                        // 直辖市：直接显示企业列表
                        console.log('✅ 确认是直辖市，直接显示企业列表');
                        if (this.onCityClick) {
                            console.log('📞 调用 onCityClick:', clickedProvince);
                            this.onCityClick(clickedProvince);
                        }
                    } else if (mapConfig.activeProvinces.includes(clickedProvince)) {
                        // 其他省份：下钻到省级地图
                        console.log('🌍 普通省份，下钻到省级地图');
                        this.init('province', clickedProvince);
                    }
                } else {
                    // 省级地图 - 点击城市
                    let cityName = params.name;

                    // 处理城市名称格式：确保以"市"结尾
                    if (!cityName.endsWith('市') && !cityName.includes('自治') && !cityName.includes('地区')) {
                        cityName += '市';
                    }

                    console.log('点击城市:', params.name, '处理后:', cityName, '是否有数据:', mapConfig.activeCities.includes(cityName));

                    if (mapConfig.activeCities.includes(cityName)) {
                        // 跳转到企业列表页
                        if (this.onCityClick) {
                            this.onCityClick(cityName);
                        }
                    }
                }
            });

        } catch (error) {
            console.error('地图加载严重错误:', error);
            this.myChart.hideLoading();

            // 显示错误提示
            this.myChart.setOption({
                title: {
                    text: '地图数据加载失败',
                    subtext: '请检查网络连接后刷新页面',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        color: '#fff',
                        fontSize: 18
                    },
                    subtextStyle: {
                        color: '#999',
                        fontSize: 14
                    }
                }
            });
        }
    }

    // 重置到全国地图
    reset() {
        this.init('china');
    }

    // 显示地图界面
    show() {
        this.container.style.display = 'block';
        gsap.to(this.container, { opacity: 1, duration: CONFIG.animation.ui.fadeDuration });
    }

    // 隐藏地图界面
    hide() {
        return new Promise(resolve => {
            gsap.to(this.container, {
                opacity: 0,
                duration: CONFIG.animation.ui.fadeDuration,
                onComplete: () => {
                    this.container.style.display = 'none';
                    resolve();
                }
            });
        });
    }

    // 调整大小
    resize() {
        if (this.myChart) {
            this.myChart.resize();
        }
    }

    // 销毁
    dispose() {
        if (this.myChart) {
            this.myChart.dispose();
            this.myChart = null;
        }
    }
}
/* Version: 1763779096 */
