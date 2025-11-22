/* ===================================
   搜索控制器
   =================================== */

import { companiesData, activeCities, activeProvinces } from '../data.js';
import { UIUtils } from './UIUtils.js';

export class SearchController {
    constructor(inputElement, callbacks) {
        this.input = inputElement;
        this.callbacks = callbacks; // { onSelectProvince, onSelectCity, onSelectCompany }

        // 创建下拉容器
        this.suggestionsContainer = this.createSuggestionsContainer();
        this.input.parentElement.appendChild(this.suggestionsContainer);

        // 当前选中的索引
        this.selectedIndex = -1;
        this.currentResults = [];

        // 初始化事件监听
        this.init();
    }

    // 创建下拉建议容器
    createSuggestionsContainer() {
        const container = document.createElement('div');
        container.className = 'search-suggestions hidden';
        return container;
    }

    // 初始化事件监听
    init() {
        // 输入事件 - 使用防抖
        const debouncedSearch = UIUtils.debounce((e) => {
            const keyword = e.target.value.trim();
            if (keyword) {
                this.performSearch(keyword);
            } else {
                this.hideSuggestions();
            }
        }, 300);

        this.input.addEventListener('input', debouncedSearch);

        // 键盘事件
        this.input.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 失去焦点时延迟关闭（给点击建议留时间）
        this.input.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // 获得焦点时如果有内容则重新搜索
        this.input.addEventListener('focus', () => {
            const keyword = this.input.value.trim();
            if (keyword) {
                this.performSearch(keyword);
            }
        });
    }

    // 执行搜索
    performSearch(keyword) {
        const results = this.search(keyword);
        this.currentResults = results;
        this.selectedIndex = -1;
        this.renderSuggestions(results);
    }

    // 模糊搜索算法
    search(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        const results = {
            provinces: [],
            cities: [],
            companies: []
        };

        // 搜索省份
        activeProvinces.forEach(province => {
            const score = this.calculateMatchScore(lowerKeyword, province.toLowerCase());
            if (score > 0) {
                results.provinces.push({ name: province, score });
            }
        });

        // 搜索城市
        activeCities.forEach(city => {
            const score = this.calculateMatchScore(lowerKeyword, city.toLowerCase());
            if (score > 0) {
                results.cities.push({ name: city, score });
            }
        });

        // 搜索企业
        companiesData.forEach(company => {
            const nameScore = this.calculateMatchScore(lowerKeyword, company.name.toLowerCase());
            const shortNameScore = this.calculateMatchScore(lowerKeyword, company.shortName.toLowerCase());
            const score = Math.max(nameScore, shortNameScore);

            if (score > 0) {
                results.companies.push({
                    name: company.shortName,
                    fullName: company.name,
                    city: company.city,
                    data: company,
                    score
                });
            }
        });

        // 按分数排序
        results.provinces.sort((a, b) => b.score - a.score);
        results.cities.sort((a, b) => b.score - a.score);
        results.companies.sort((a, b) => b.score - a.score);

        // 限制结果数量：省份2条、城市3条、企业5条，总计最多8条
        results.provinces = results.provinces.slice(0, 2);
        results.cities = results.cities.slice(0, 3);
        results.companies = results.companies.slice(0, 5);

        // 再次确保总数不超过8条
        const total = results.provinces.length + results.cities.length + results.companies.length;
        if (total > 8) {
            // 优先保证省份和城市，然后企业
            const remaining = 8 - results.provinces.length - results.cities.length;
            if (remaining < results.companies.length) {
                results.companies = results.companies.slice(0, remaining);
            }
        }

        return results;
    }

    // 计算匹配分数
    calculateMatchScore(keyword, target) {
        // 去除"省"、"市"等后缀进行匹配
        const cleanTarget = target.replace(/省$|市$/g, '');
        const cleanKeyword = keyword.replace(/省$|市$/g, '');

        // 完全匹配
        if (cleanTarget === cleanKeyword || target === keyword) {
            return 100;
        }

        // 开头匹配
        if (cleanTarget.startsWith(cleanKeyword) || target.startsWith(keyword)) {
            return 80;
        }

        // 包含匹配
        if (cleanTarget.includes(cleanKeyword) || target.includes(keyword)) {
            return 60;
        }

        return 0;
    }

    // 渲染搜索建议
    renderSuggestions(results) {
        const { provinces, cities, companies } = results;
        const total = provinces.length + cities.length + companies.length;

        if (total === 0) {
            this.suggestionsContainer.innerHTML = '<div class="search-no-result">未找到相关结果</div>';
            this.showSuggestions();
            return;
        }

        let html = '';

        // 渲染省份
        provinces.forEach((item, index) => {
            html += this.createSuggestionItem('province', item.name, null, index);
        });

        // 渲染城市
        cities.forEach((item, index) => {
            const globalIndex = provinces.length + index;
            html += this.createSuggestionItem('city', item.name, null, globalIndex);
        });

        // 渲染企业
        companies.forEach((item, index) => {
            const globalIndex = provinces.length + cities.length + index;
            html += this.createSuggestionItem('company', item.name, item.city, globalIndex);
        });

        this.suggestionsContainer.innerHTML = html;
        this.showSuggestions();

        // 绑定点击事件
        this.bindClickEvents();
    }

    // 创建单个建议项
    createSuggestionItem(type, name, city, index) {
        const icons = {
            province: '🗺️',
            city: '🏙️',
            company: '🏢'
        };

        const cityTag = city ? `<span class="search-city-tag">${city}</span>` : '';

        return `
            <div class="search-item" data-index="${index}" data-type="${type}">
                <span class="search-icon">${icons[type]}</span>
                <span class="search-name">${name}</span>
                ${cityTag}
            </div>
        `;
    }

    // 绑定点击事件
    bindClickEvents() {
        const items = this.suggestionsContainer.querySelectorAll('.search-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.selectItem(index);
            });
        });
    }

    // 选择项目
    selectItem(index) {
        const { provinces, cities, companies } = this.currentResults;
        const provincesCount = provinces.length;
        const citiesCount = cities.length;

        let type, item;

        if (index < provincesCount) {
            type = 'province';
            item = provinces[index];
        } else if (index < provincesCount + citiesCount) {
            type = 'city';
            item = cities[index - provincesCount];
        } else {
            type = 'company';
            item = companies[index - provincesCount - citiesCount];
        }

        this.executeSelection(type, item);
        this.hideSuggestions();
        this.input.value = '';
    }

    // 执行选择
    executeSelection(type, item) {
        switch (type) {
            case 'province':
                if (this.callbacks.onSelectProvince) {
                    this.callbacks.onSelectProvince(item.name);
                }
                break;
            case 'city':
                if (this.callbacks.onSelectCity) {
                    this.callbacks.onSelectCity(item.name);
                }
                break;
            case 'company':
                if (this.callbacks.onSelectCompany) {
                    this.callbacks.onSelectCompany(item.data);
                }
                break;
        }
    }

    // 键盘事件处理
    handleKeyboard(e) {
        const items = this.suggestionsContainer.querySelectorAll('.search-item');
        const totalItems = items.length;

        if (totalItems === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % totalItems;
                this.updateSelection(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + totalItems) % totalItems;
                this.updateSelection(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < totalItems) {
                    this.selectItem(this.selectedIndex);
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                this.input.blur();
                break;
        }
    }

    // 更新选中状态
    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    // 显示建议
    showSuggestions() {
        this.suggestionsContainer.classList.remove('hidden');
    }

    // 隐藏建议
    hideSuggestions() {
        this.suggestionsContainer.classList.add('hidden');
        this.selectedIndex = -1;
    }
}
