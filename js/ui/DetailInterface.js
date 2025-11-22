/* ===================================
   企业详情页面控制器
   =================================== */

import { CONFIG } from '../config.js';

export class DetailInterface {
    constructor(container, onBackClick) {
        this.container = container;
        this.onBackClick = onBackClick;
        this.currentCompany = null;

        // Lightbox相关
        this.lightboxImages = [];
        this.currentImageIndex = 0;
        this.initLightbox();
    }

    // 初始化Lightbox
    initLightbox() {
        this.lightbox = document.getElementById('image-lightbox');
        this.lightboxImage = document.getElementById('lightbox-image');
        this.lightboxClose = document.getElementById('lightbox-close');
        this.lightboxPrev = document.getElementById('lightbox-prev');
        this.lightboxNext = document.getElementById('lightbox-next');
        this.lightboxCurrent = document.getElementById('lightbox-current');
        this.lightboxTotal = document.getElementById('lightbox-total');

        // 绑定事件
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev.addEventListener('click', () => this.prevImage());
        this.lightboxNext.addEventListener('click', () => this.nextImage());

        // 点击背景关闭
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        // 键盘控制
        this.keyboardHandler = (e) => {
            if (!this.lightbox.classList.contains('hidden')) {
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowLeft') this.prevImage();
                if (e.key === 'ArrowRight') this.nextImage();
            }
        };
        document.addEventListener('keydown', this.keyboardHandler);

        // 触摸滑动支持（移动端）
        let touchStartX = 0;
        let touchEndX = 0;

        this.lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) { // 滑动距离大于50px才触发
                if (diff > 0) {
                    this.nextImage(); // 向左滑，下一张
                } else {
                    this.prevImage(); // 向右滑，上一张
                }
            }
        });
    }

    // 打开Lightbox
    openLightbox(images, index) {
        this.lightboxImages = images;
        this.currentImageIndex = index;
        this.lightboxTotal.textContent = images.length;
        this.showImage(index);
        this.lightbox.classList.remove('hidden');
        this.lightbox.classList.add('flex');

        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }

    // 关闭Lightbox
    closeLightbox() {
        this.lightbox.classList.add('hidden');
        this.lightbox.classList.remove('flex');
        document.body.style.overflow = '';
    }

    // 显示指定图片
    showImage(index) {
        if (index < 0) index = this.lightboxImages.length - 1;
        if (index >= this.lightboxImages.length) index = 0;

        this.currentImageIndex = index;
        this.lightboxImage.src = this.lightboxImages[index];
        this.lightboxCurrent.textContent = index + 1;

        // 只有一张图片时隐藏左右按钮
        if (this.lightboxImages.length <= 1) {
            this.lightboxPrev.style.display = 'none';
            this.lightboxNext.style.display = 'none';
        } else {
            this.lightboxPrev.style.display = 'flex';
            this.lightboxNext.style.display = 'flex';
        }
    }

    // 上一张
    prevImage() {
        this.showImage(this.currentImageIndex - 1);
    }

    // 下一张
    nextImage() {
        this.showImage(this.currentImageIndex + 1);
    }

    // 显示企业详情
    show(company) {
        this.currentCompany = company;

        // 填充左侧基本信息
        document.getElementById('d-name').innerText = company.name;
        document.getElementById('d-tags').innerHTML = company.tags
            .map(t => `<span class="tag-badge">${t}</span>`)
            .join(' ');
        document.getElementById('d-intro').innerText = company.intro;
        document.getElementById('d-reason').innerText = company.reason;
        document.getElementById('d-region').innerText = company.region;

        // 填充相册
        this.renderGallery(company.gallery, company.shortName);

        // 填充业务板块
        this.renderSegments(company.segments);

        // 显示界面
        this.container.style.display = 'block';
        gsap.to(this.container, {
            opacity: 1,
            duration: CONFIG.animation.ui.fadeDuration
        });

        // 业务板块进场动画
        gsap.to('.segment-card', {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            delay: 0.2,
            ease: "power2.out"
        });
    }

    // 渲染相册
    renderGallery(gallery, companyName) {
        const galContainer = document.getElementById('d-gallery');
        galContainer.innerHTML = '';

        if (gallery && gallery.length > 0) {
            gallery.forEach((imgUrl, index) => {
                const img = document.createElement('img');
                img.src = imgUrl;
                img.className = 'gallery-img cursor-pointer hover:opacity-80 transition-opacity rounded-lg';
                img.alt = companyName + ' 相册';

                // 添加点击事件，打开lightbox
                img.addEventListener('click', () => {
                    this.openLightbox(gallery, index);
                });

                galContainer.appendChild(img);
            });
        } else {
            galContainer.innerHTML = '<div class="col-span-3 text-gray-500 text-sm text-center py-4">暂无图片</div>';
        }
    }

    // 渲染业务板块
    renderSegments(segments) {
        const segContainer = document.getElementById('d-segments');
        segContainer.innerHTML = '';

        segments.forEach(seg => {
            const segDiv = document.createElement('div');
            segDiv.className = 'segment-card opacity-0 translate-y-4';

            const jobsHtml = seg.jobs
                .map(j => `<span class="job-tag">${j}</span>`)
                .join('');

            segDiv.innerHTML = `
                <div class="segment-title">${seg.name}</div>
                <div class="flex flex-wrap">${jobsHtml}</div>
            `;

            segContainer.appendChild(segDiv);
        });
    }

    // 隐藏详情界面
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

    // 返回列表
    async backToList() {
        await this.hide();
        if (this.onBackClick) {
            this.onBackClick();
        }
    }

    // 销毁
    dispose() {
        this.currentCompany = null;
        const galContainer = document.getElementById('d-gallery');
        const segContainer = document.getElementById('d-segments');
        if (galContainer) galContainer.innerHTML = '';
        if (segContainer) segContainer.innerHTML = '';

        // 清理键盘事件监听器
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // 关闭lightbox
        this.closeLightbox();
    }
}
