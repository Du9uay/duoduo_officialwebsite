/* ===================================
   企业列表界面控制器
   =================================== */

import { CONFIG } from '../config.js';
import { companiesData } from '../data.js';

export class ListInterface {
    constructor(container, onCompanyClick, onBackClick) {
        this.container = container;
        this.onCompanyClick = onCompanyClick;
        this.onBackClick = onBackClick;
        this.currentCity = '';
        this.cardsContainer = document.getElementById('cards-container');
    }

    // 显示指定城市的企业列表
    show(cityName) {
        this.currentCity = cityName;

        console.log('=== ListInterface.show 调试 ===');
        console.log('要显示的城市:', cityName);
        console.log('所有企业数量:', companiesData.length);
        console.log('所有城市:', [...new Set(companiesData.map(c => c.city))].join(', '));

        // 设置标题
        document.getElementById('list-city-title').innerText = cityName + ' · 企业名录';

        // 过滤该城市的企业数据
        let cityCompanies = companiesData.filter(c => c.city === cityName);

        console.log('过滤后的企业数量:', cityCompanies.length);
        if (cityCompanies.length === 0) {
            console.warn('⚠️ 没有找到该城市的企业数据！');
        }

        // 更新左侧统计
        document.getElementById('company-count').innerText = cityCompanies.length;
        const jobCount = cityCompanies.reduce(
            (sum, c) => sum + c.segments.reduce((s, seg) => s + seg.jobs.length, 0),
            0
        );
        document.getElementById('job-count').innerText = jobCount;

        // 清空旧数据
        this.cardsContainer.innerHTML = '';

        // 渲染企业卡片
        cityCompanies.forEach((company) => {
            const card = this.createCompanyCard(company);
            this.cardsContainer.appendChild(card);
        });

        // 显示界面
        this.container.style.display = 'block';
        gsap.to(this.container, {
            opacity: 1,
            duration: CONFIG.animation.ui.fadeDuration
        });

        // 卡片进场动画
        gsap.to('.company-card', {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: CONFIG.animation.ui.cardStagger,
            delay: CONFIG.animation.ui.cardDelay,
            ease: "power2.out"
        });
    }

    // 创建企业卡片
    createCompanyCard(company) {
        const card = document.createElement('div');
        card.className = 'company-card rounded-xl overflow-hidden cursor-pointer opacity-0 translate-y-10';
        card.onclick = () => {
            if (this.onCompanyClick) {
                this.onCompanyClick(company);
            }
        };

        // 生成标签HTML
        const tagsHtml = company.tags.map(t => `<span class="tag-badge">${t}</span>`).join(' ');

        // 生成职位预览
        const jobsPreview = company.segments[0].jobs.slice(0, 3).join(' / ');

        card.innerHTML = `
            <div class="h-40 w-full overflow-hidden relative">
                <img src="${company.cover}" class="w-full h-full object-cover" alt="${company.shortName}">
                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
            <div class="p-5 text-white">
                <h3 class="font-bold text-lg mb-2">${company.shortName}</h3>
                <div class="flex flex-wrap gap-2 mb-3">${tagsHtml}</div>
                <p class="text-xs text-gray-400 line-clamp-2 mb-3">${company.intro}</p>
                <div class="pt-3 border-t border-white/10 flex justify-between items-center">
                    <span class="text-xs text-gray-500">热招: ${jobsPreview}...</span>
                    <span class="text-cyan-400 text-xs font-bold">详情 →</span>
                </div>
            </div>
        `;

        return card;
    }

    // 隐藏列表界面
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

    // 返回地图
    async backToMap() {
        await this.hide();
        if (this.onBackClick) {
            this.onBackClick();
        }
    }

    // 销毁
    dispose() {
        if (this.cardsContainer) {
            this.cardsContainer.innerHTML = '';
        }
    }
}
