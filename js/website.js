/* ===================================
   企业官网逻辑模块
   =================================== */

// 轮播图数据（从CSV加载）
let newsData = [];

// 菜单状态
let isMenuOpen = false;
let currentCarouselIndex = 0;
let carouselInterval = null;

/**
 * 初始化官网功能
 * @param {Function} navigateToApp - 切换到3D平台的回调函数
 */
export async function initWebsite(navigateToApp) {
    // 1. 加载CSV数据
    await loadNewsData();

    // 2. 初始化汉堡菜单
    initMenu(navigateToApp);

    // 3. 初始化轮播图
    initCarousel();

    // 4. 默认显示新闻中心
    switchPage('news');
}

/**
 * 加载CSV数据
 */
async function loadNewsData() {
    try {
        const response = await fetch('./网站数据_新闻内容_所有记录.csv');
        const csvText = await response.text();

        // 解析CSV
        const lines = csvText.trim().split('\n');
        // 跳过标题行
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // 使用正则表达式处理CSV（处理可能包含逗号的字段）
            const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
            if (matches && matches.length >= 3) {
                const title = matches[0].replace(/^,?"?|"?$/g, '').trim();
                const link = matches[1].replace(/^,?"?|"?$/g, '').trim();
                const imageUrl = matches[2].replace(/^,?"?|"?$/g, '').trim();

                newsData.push({
                    title,
                    link,
                    imageUrl,
                    isVideo: link.endsWith('.mp4')  // 根据link判断是否是视频
                });
            }
        }

        console.log('加载了', newsData.length, '条新闻数据');
    } catch (error) {
        console.error('加载新闻数据失败:', error);
        // 使用默认数据
        newsData = [{
            title: '加载失败',
            link: '',
            imageUrl: 'https://via.placeholder.com/1200x600/1e293b/38bdf8?text=加载失败',
            isVideo: false
        }];
    }
}

/**
 * 初始化汉堡菜单逻辑
 */
function initMenu(navigateToApp) {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = document.querySelectorAll('.menu-link');
    const navLogoArea = document.getElementById('nav-logo-area');

    // 点击logo区域返回首页
    if (navLogoArea) {
        navLogoArea.style.cursor = 'pointer';
        navLogoArea.addEventListener('click', () => {
            switchPage('news');
        });
    }

    // 汉堡按钮点击事件
    menuBtn.addEventListener('click', toggleMenu);

    // 菜单项点击事件
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;

            // 关闭菜单
            closeMenu();

            // 路由导航
            if (target === 'app') {
                // 切换到 3D 内推平台
                navigateToApp();
            } else {
                // 切换官网子页面
                switchPage(target);
            }
        });
    });

    // 点击菜单背景关闭菜单
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            closeMenu();
        }
    });
}

/**
 * 切换菜单开关状态
 */
function toggleMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
        mobileMenu.classList.remove('translate-x-full');
        menuBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    } else {
        mobileMenu.classList.add('translate-x-full');
        menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
}

/**
 * 关闭菜单
 */
function closeMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    isMenuOpen = false;
    mobileMenu.classList.add('translate-x-full');
    menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
}

/**
 * 页面切换
 * @param {string} pageId - 页面ID (news/about/product)
 */
export function switchPage(pageId) {
    const websiteContainer = document.getElementById('website-container');
    const appContainer = document.getElementById('app-container');
    const navbar = document.getElementById('navbar');

    // 确保官网容器显示，3D容器隐藏
    websiteContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');

    // 显示导航栏
    navbar.classList.remove('-translate-y-full');

    // 隐藏所有页面
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.add('hidden');
    });

    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // 更新菜单高亮状态
    updateMenuHighlight(pageId);

    // 重新启动轮播图（如果是新闻页面）
    if (pageId === 'news') {
        startCarousel();
    } else {
        stopCarousel();
    }
}

/**
 * 更新菜单高亮状态
 * @param {string} activePageId - 当前激活的页面ID
 */
function updateMenuHighlight(activePageId) {
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        const target = link.dataset.target;

        if (target === activePageId) {
            // 激活状态：白色粗体
            link.classList.remove('text-gray-400');
            link.classList.add('text-white', 'font-bold');
        } else if (target === 'app') {
            // 内推平台保持青色
            link.classList.remove('text-white', 'font-bold');
            link.classList.add('text-cyan-400');
        } else {
            // 非激活状态：灰色
            link.classList.remove('text-white', 'font-bold');
            link.classList.add('text-gray-400');
        }
    });
}

/**
 * 初始化轮播图
 */
function initCarousel() {
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!track || !dotsContainer) return;

    // 清空现有内容
    track.innerHTML = '';
    dotsContainer.innerHTML = '';

    // 生成轮播项
    newsData.forEach((item, index) => {
        // 创建轮播项容器
        const carouselItem = document.createElement('div');
        carouselItem.className = 'carousel-item';
        carouselItem.style.cursor = 'pointer';

        if (item.isVideo) {
            // 视频项：显示视频封面/缩略图
            const videoPreview = document.createElement('img');
            videoPreview.src = item.imageUrl;  // 使用CSV中的缩略图URL
            videoPreview.className = 'carousel-img';
            videoPreview.alt = item.title;

            // 添加播放图标
            const playIcon = document.createElement('div');
            playIcon.className = 'video-play-icon';
            playIcon.innerHTML = '<i class="fa-solid fa-play"></i>';

            carouselItem.appendChild(videoPreview);
            carouselItem.appendChild(playIcon);

            // 点击播放视频
            carouselItem.addEventListener('click', () => {
                openVideoModal(item.link, item.title);  // 使用CSV中的视频URL
            });
        } else {
            // 图片项
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.className = 'carousel-img';
            img.alt = item.title;
            carouselItem.appendChild(img);

            // 点击跳转链接
            if (item.link) {
                carouselItem.addEventListener('click', () => {
                    window.open(item.link, '_blank');
                });
            }
        }

        // 添加标题覆盖层
        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'carousel-title-overlay';
        titleOverlay.textContent = item.title;
        carouselItem.appendChild(titleOverlay);

        track.appendChild(carouselItem);

        // 生成指示点
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });

    // 添加触摸滑动功能
    initTouchSwipe(track);

    // 启动自动播放
    startCarousel();
}

/**
 * 初始化触摸滑动功能
 */
function initTouchSwipe(track) {
    let startX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        stopCarousel(); // 暂停自动播放
    });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        // 阻止默认滚动行为
        e.preventDefault();
    }, { passive: false });

    track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        // 滑动阈值：50像素
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // 向左滑动 - 下一张
                currentCarouselIndex = (currentCarouselIndex + 1) % newsData.length;
            } else {
                // 向右滑动 - 上一张
                currentCarouselIndex = (currentCarouselIndex - 1 + newsData.length) % newsData.length;
            }
            goToSlide(currentCarouselIndex);
        }

        // 恢复自动播放
        startCarousel();
    });
}

/**
 * 跳转到指定幻灯片
 * @param {number} index - 幻灯片索引
 */
function goToSlide(index) {
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!track || !dotsContainer) return;

    currentCarouselIndex = index;

    // 更新轮播图位置
    track.style.transform = `translateX(-${index * 100}%)`;

    // 更新指示点
    Array.from(dotsContainer.children).forEach((dot, i) => {
        if (i === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

/**
 * 启动轮播图自动播放
 */
function startCarousel() {
    // 清除之前的定时器
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }

    // 每3秒切换一次
    carouselInterval = setInterval(() => {
        currentCarouselIndex = (currentCarouselIndex + 1) % newsData.length;
        goToSlide(currentCarouselIndex);
    }, 3000);
}

/**
 * 停止轮播图自动播放
 */
function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

/**
 * 打开视频播放模态窗口
 */
function openVideoModal(videoUrl, title) {
    // 创建模态窗口
    const modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-modal-content">
            <div class="video-modal-header">
                <h3>${title}</h3>
                <button class="video-modal-close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="video-modal-body">
                <video controls autoplay style="width: 100%; max-height: 70vh;">
                    <source src="${videoUrl}" type="video/mp4">
                    您的浏览器不支持视频播放。
                </video>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 关闭按钮事件
    const closeBtn = modal.querySelector('.video-modal-close');
    closeBtn.addEventListener('click', () => {
        closeVideoModal();
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    });

    // 显示模态窗口
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

/**
 * 关闭视频播放模态窗口
 */
function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * 更新轮播图数据（供外部调用）
 * @param {Array<Object>} newData - 新的新闻数据数组
 */
export function updateCarouselData(newData) {
    if (!Array.isArray(newData) || newData.length === 0) {
        console.warn('Invalid carousel data provided');
        return;
    }

    // 更新数据
    newsData.length = 0;
    newsData.push(...newData);

    // 重新初始化
    currentCarouselIndex = 0;
    initCarousel();
}
