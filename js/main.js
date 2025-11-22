/* ===================================
   应用主入口 - 模块编排与路由控制
   =================================== */

import { SceneManager } from './scene/SceneManager.js';
import { MapInterface } from './ui/MapInterface.js';
import { ListInterface } from './ui/ListInterface.js';
import { DetailInterface } from './ui/DetailInterface.js';
import { SearchController } from './ui/SearchController.js';
import { UIUtils } from './ui/UIUtils.js';
import { initWebsite, switchPage } from './website.js';

class App {
    constructor() {
        // 官网 DOM 引用
        this.websiteContainer = document.getElementById('website-container');
        this.appContainer = document.getElementById('app-container');
        this.navbar = document.getElementById('navbar');

        // 3D平台 DOM 引用
        this.canvasContainer = document.getElementById('canvas-container');
        this.mapInterface = document.getElementById('map-interface');
        this.listInterface = document.getElementById('list-interface');
        this.detailInterface = document.getElementById('detail-interface');
        this.mapLogoArea = document.getElementById('map-logo-area');

        // UI 元素
        this.uiLayer = document.getElementById('ui-layer');
        this.hint = document.querySelector('.instruction-hint');
        this.speedLines = document.getElementById('speed-lines');
        this.cloudFog = document.getElementById('cloud-fog');

        // 模块实例
        this.sceneManager = null;
        this.mapController = null;
        this.listController = null;
        this.detailController = null;

        // 2D地图初始化标志，防止重复初始化导致省级地图被覆盖
        this.is2DInitialized = false;

        this.init();
    }

    // 初始化应用
    async init() {
        // 1. 优先初始化官网（立即执行，等待CSV加载）
        await initWebsite(() => this.switchToApp());

        // 2. 初始化 3D 平台的控制器（但不启动场景）
        this.mapController = new MapInterface(
            this.mapInterface,
            (cityName) => this.showList(cityName)
        );

        this.listController = new ListInterface(
            this.listInterface,
            (company) => this.showDetail(company),
            () => this.backToMap()
        );

        this.detailController = new DetailInterface(
            this.detailInterface,
            () => this.backToList()
        );

        // 初始化搜索控制器（PC端）
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            this.searchController = new SearchController(searchInput, {
                onSelectProvince: (provinceName) => {
                    this.mapController.init('province', provinceName);
                },
                onSelectCity: (cityName) => {
                    this.showList(cityName);
                },
                onSelectCompany: (company) => {
                    // 设置当前城市为企业所属城市，以便返回时显示正确的列表
                    this.listController.currentCity = company.city;
                    this.showDetail(company);
                }
            });
        }

        // 初始化搜索控制器（移动端）
        const searchInputMobile = document.getElementById('search-input-mobile');
        if (searchInputMobile) {
            this.searchControllerMobile = new SearchController(searchInputMobile, {
                onSelectProvince: (provinceName) => {
                    this.mapController.init('province', provinceName);
                },
                onSelectCity: (cityName) => {
                    this.showList(cityName);
                },
                onSelectCompany: (company) => {
                    // 设置当前城市为企业所属城市，以便返回时显示正确的列表
                    this.listController.currentCity = company.city;
                    this.showDetail(company);
                }
            });
        }

        // 3. 绑定全局函数和事件
        this.bindGlobalFunctions();

        // 4. 默认显示官网首页
        this.showWebsite();
    }

    // 显示官网（确保官网可见，3D隐藏）
    showWebsite() {
        this.websiteContainer.classList.remove('hidden');
        this.appContainer.classList.add('hidden');
        this.navbar.classList.remove('-translate-y-full');
    }

    // 切换到 3D 内推平台
    switchToApp() {
        // 隐藏官网
        this.websiteContainer.classList.add('hidden');

        // 隐藏顶部导航栏（全屏体验）
        this.navbar.classList.add('-translate-y-full');

        // 显示 3D 容器
        this.appContainer.classList.remove('hidden');

        // 每次都重新初始化 3D 场景
        this.init3DScene();
    }

    // 初始化 3D 场景（每次进入都重新加载）
    init3DScene() {
        // 如果有旧场景，先清理
        if (this.sceneManager) {
            this.sceneManager.dispose();
            this.sceneManager = null;
        }

        // 重置UI状态
        this.canvasContainer.style.display = 'block';
        this.speedLines.style.display = 'block';
        this.cloudFog.style.display = 'none';  // 云雾初始隐藏，转场时才显示
        this.cloudFog.style.opacity = '0';
        this.mapInterface.style.display = 'none';

        // 创建场景管理器
        this.sceneManager = new SceneManager(
            this.canvasContainer,
            () => this.onTransitionComplete()
        );

        // 初始化转场系统
        this.sceneManager.initTransition({
            uiLayer: this.uiLayer,
            hint: this.hint,
            speedLines: this.speedLines,
            cloudFog: this.cloudFog
        });

        // 启动开场动画
        this.sceneManager.startIntroSequence({
            uiLayer: this.uiLayer,
            hint: this.hint
        });
    }

    // 从 3D 平台返回官网
    switchToWebsite(pageId = 'news') {
        // 隐藏 3D 容器
        this.appContainer.classList.add('hidden');

        // 显示官网
        this.websiteContainer.classList.remove('hidden');

        // 显示导航栏
        this.navbar.classList.remove('-translate-y-full');

        // 切换到指定页面
        switchPage(pageId);
    }

    // 转场完成回调（3D地球 → 2D地图）
    onTransitionComplete() {
        this.switchTo2D();
    }

    // 切换到2D地图界面
    switchTo2D() {
        // 防止重复初始化：如果已经初始化过，直接返回
        if (this.is2DInitialized) {
            console.log('⏭️ 2D地图已初始化，跳过重复初始化');
            return;
        }

        // 隐藏3D容器和特效层
        this.canvasContainer.style.display = 'none';
        this.speedLines.style.display = 'none';

        // 先显示地图容器（opacity: 0，但display: block）
        this.mapInterface.style.display = 'block';
        this.mapInterface.style.opacity = '0';

        // 使用 requestAnimationFrame 确保浏览器完成布局渲染
        requestAnimationFrame(() => {
            requestAnimationFrame(async () => {
                // 现在容器已经有了正确的尺寸，可以安全初始化ECharts
                await this.mapController.init('china');

                // 地图初始化完成后，立即调用resize确保尺寸正确
                this.mapController.resize();

                // 标记2D地图已初始化，防止后续重复初始化
                this.is2DInitialized = true;

                // 延迟淡入，提升视觉效果
                setTimeout(() => {
                    gsap.to(this.mapInterface, { opacity: 1, duration: 1 });
                    gsap.to(this.cloudFog, {
                        opacity: 0,
                        duration: 1,
                        onComplete: () => {
                            this.cloudFog.style.display = 'none';
                        }
                    });
                }, 50);
            });
        });
    }

    // 显示企业列表
    async showList(cityName) {
        await this.mapController.hide();
        this.listController.show(cityName);
    }

    // 显示企业详情
    async showDetail(company) {
        await this.listController.hide();
        this.detailController.show(company);
    }

    // 返回列表
    async backToList() {
        await this.detailController.hide();
        this.listController.show(this.listController.currentCity);
    }

    // 返回地图
    async backToMap() {
        await this.listController.hide();
        this.mapController.show();
        this.mapController.resize(); // 确保地图尺寸正确
    }

    // 绑定全局函数和事件
    bindGlobalFunctions() {
        // 地图界面logo点击返回官网
        if (this.mapLogoArea) {
            this.mapLogoArea.addEventListener('click', () => {
                this.switchToWebsite('news');
            });
        }

        // 重置地图到全国视图
        window.resetMapToChina = () => {
            if (this.mapController) {
                this.mapController.reset();
            }
        };

        // 从列表返回地图
        window.backToMap = () => {
            this.backToMap();
        };

        // 从详情返回列表
        window.backToList = () => {
            this.backToList();
        };
    }
}

// 应用启动
const app = new App();
