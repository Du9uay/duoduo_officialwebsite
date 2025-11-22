/* ===================================
   UI工具函数
   =================================== */

import { CONFIG } from '../config.js';

export class UIUtils {
    /**
     * 切换界面显示/隐藏
     * @param {HTMLElement} hideElement - 要隐藏的元素
     * @param {HTMLElement} showElement - 要显示的元素
     * @param {Function} onComplete - 完成回调
     */
    static switchInterface(hideElement, showElement, onComplete) {
        const duration = CONFIG.animation.ui.fadeDuration;

        gsap.to(hideElement, {
            opacity: 0,
            duration: duration,
            onComplete: () => {
                hideElement.style.display = 'none';
                showElement.style.display = 'block';
                gsap.to(showElement, {
                    opacity: 1,
                    duration: duration,
                    onComplete: onComplete
                });
            }
        });
    }

    /**
     * 批量显示元素（带渐入动画）
     * @param {string} selector - CSS选择器
     * @param {object} options - 动画选项
     */
    static staggerShow(selector, options = {}) {
        const defaults = {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: CONFIG.animation.ui.cardStagger,
            delay: CONFIG.animation.ui.cardDelay,
            ease: "power2.out"
        };

        gsap.to(selector, { ...defaults, ...options });
    }

    /**
     * 移动端触摸事件适配
     * @param {HTMLElement} element - 目标元素
     * @param {object} handlers - 事件处理器 { onTap, onSwipe }
     */
    static bindTouchEvents(element, handlers) {
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        });

        element.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;

            // 判断是点击还是滑动
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
                // 点击
                if (handlers.onTap) handlers.onTap(e);
            } else {
                // 滑动
                if (handlers.onSwipe) {
                    const direction = Math.abs(deltaX) > Math.abs(deltaY)
                        ? (deltaX > 0 ? 'right' : 'left')
                        : (deltaY > 0 ? 'down' : 'up');
                    handlers.onSwipe(direction, e);
                }
            }
        });
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function}
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制间隔（毫秒）
     * @returns {Function}
     */
    static throttle(func, limit = 100) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 检测是否为移动设备
     * @returns {boolean}
     */
    static isMobile() {
        return window.innerWidth <= CONFIG.mobile.breakpoint;
    }

    /**
     * 获取安全区域内边距
     * @returns {object} { top, bottom, left, right }
     */
    static getSafeAreaInsets() {
        const computed = getComputedStyle(document.documentElement);
        return {
            top: parseInt(computed.getPropertyValue('env(safe-area-inset-top)')) || 0,
            bottom: parseInt(computed.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
            left: parseInt(computed.getPropertyValue('env(safe-area-inset-left)')) || 0,
            right: parseInt(computed.getPropertyValue('env(safe-area-inset-right)')) || 0
        };
    }

    /**
     * 初始化陀螺仪控制（移动端视差）
     * @param {Function} callback - 回调函数，接收 (beta, gamma) 参数
     */
    static initGyroscope(callback) {
        if (!this.isMobile()) return;

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                const beta = e.beta || 0;   // 前后倾斜（-180 ~ 180）
                const gamma = e.gamma || 0; // 左右倾斜（-90 ~ 90）
                callback(beta, gamma);
            });
        }
    }

    /**
     * 显示加载提示
     * @param {string} text - 提示文本
     */
    static showLoading(text = '加载中...') {
        const existing = document.getElementById('loading-overlay');
        if (existing) return;

        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: #38bdf8;
            font-size: 1rem;
        `;
        overlay.innerText = text;
        document.body.appendChild(overlay);
    }

    /**
     * 隐藏加载提示
     */
    static hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
