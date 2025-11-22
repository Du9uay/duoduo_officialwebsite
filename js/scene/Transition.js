/* ===================================
   转场特效 - 从3D地球到2D地图的超空间跳跃
   =================================== */

import { CONFIG } from '../config.js';

export class Transition {
    constructor(camera, earthModel, uiElements, onComplete) {
        this.camera = camera;
        this.earthModel = earthModel;
        this.uiElements = uiElements; // { uiLayer, hint, speedLines, cloudFog }
        this.onComplete = onComplete;
        this.isTransitioning = false;
    }

    // 触发超空间跳跃转场
    trigger() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // 获取UI元素
        const { uiLayer, hint, speedLines, cloudFog } = this.uiElements;

        // 0. UI 消失
        uiLayer.style.opacity = 0;
        hint.style.opacity = 0;

        const earthGroup = this.earthModel.getGroup();
        const clouds = this.earthModel.getClouds();
        const atmosphere = this.earthModel.getAtmosphere();

        // 创建GSAP时间线
        const tl = gsap.timeline({
            onComplete: () => {
                this.isTransitioning = false;
                if (this.onComplete) this.onComplete();
            }
        });

        // 转场配置
        const warpConfig = CONFIG.warp;
        const transConfig = CONFIG.animation.transition;

        // 1. 地球对齐 + 速度线出现
        tl.to(earthGroup.rotation, {
            y: warpConfig.targetRotationY,
            x: warpConfig.targetRotationX,
            duration: transConfig.earthRotation,
            ease: "power2.inOut"
        }, "start");

        tl.to(speedLines, {
            opacity: 1,
            scale: 1.5,
            duration: 1.0,
            ease: "power1.in"
        }, "start");

        // 2. 镜头急速突进 (模拟穿过云层)
        tl.to(this.camera.position, {
            z: warpConfig.finalCameraZ,
            x: 0,
            y: 0,
            duration: transConfig.cameraZoom,
            ease: "expo.in",
            onUpdate: () => {
                // 镜头抖动效果 (Camera Shake) - 只在z<8时轻微抖动
                const z = this.camera.position.z;
                if (z < warpConfig.shakeThreshold.max && z > warpConfig.shakeThreshold.min) {
                    const intensity = warpConfig.shakeIntensity;
                    const shakeX = (Math.random() - 0.5) * intensity;
                    const shakeY = (Math.random() - 0.5) * intensity;
                    this.camera.position.x += shakeX;
                    this.camera.position.y += shakeY;
                }
            }
        }, "start");

        // 3. 材质变化：大气层和云层迅速变淡（为了不挡视线）
        tl.to([clouds.material, atmosphere.material], {
            opacity: 0,
            duration: 0.5
        }, "-=0.8");

        // 4. "云雾吞噬"特效 (Backdrop Blur + Brightness)
        tl.to(cloudFog, {
            opacity: 1,
            scale: 1.2,
            backdropFilter: "blur(20px)",
            duration: transConfig.fogFade,
            ease: "power2.in"
        }, "-=0.8");
    }

    // 重置转场状态
    reset() {
        this.isTransitioning = false;
    }

    // 检查是否正在转场
    isActive() {
        return this.isTransitioning;
    }
}
