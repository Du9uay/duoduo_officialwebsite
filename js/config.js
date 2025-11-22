/* ===================================
   全局配置常量
   =================================== */

import { activeCities, activeProvinces } from './data.js';

export const CONFIG = {
    // 地图配置
    map: {
        geoJsonUrls: {
            china: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
            // 更多省份可以在这里添加
            jiangsu: 'https://geo.datav.aliyun.com/areas_v3/bound/320000_full.json',
            hebei: 'https://geo.datav.aliyun.com/areas_v3/bound/130000_full.json',
            anhui: 'https://geo.datav.aliyun.com/areas_v3/bound/340000_full.json',
            hubei: 'https://geo.datav.aliyun.com/areas_v3/bound/420000_full.json',
            hunan: 'https://geo.datav.aliyun.com/areas_v3/bound/430000_full.json'
        },
        activeProvinces: activeProvinces,  // 从data.js动态导入
        activeCities: activeCities,        // 从data.js动态导入
        defaultZoom: 1.2
    },

    // 3D场景配置
    scene: {
        camera: {
            fov: 60,
            near: 0.1,
            far: 2000,
            initialZ: 100, // 开场动画起点
            defaultZ: 16   // 默认位置
        },
        earth: {
            radius: 5,
            segments: 64,
            cloudRadius: 5.08,
            atmosphereRadius: 5.35
        },
        stars: {
            count: 10000,
            size: 1.4,
            colors: [
                0xffffff, // 纯白
                0xaaddff, // 蓝白
                0xffddaa, // 金黄
                0xddaaff, // 淡紫
                0xffffff, // 增加白色权重
                0xffffff
            ]
        },
        fog: {
            color: 0x020205,
            density: 0.015
        },
        lights: {
            ambient: 0x050510,
            sun: {
                color: 0xffffff,
                intensity: 1.5,
                position: [30, 10, 30]
            },
            rim: {
                color: 0x0088ff,
                intensity: 3,
                position: [-30, 20, -5]
            }
        }
    },

    // 动画时长配置
    animation: {
        intro: {
            cameraDuration: 5,      // 摄像机推进时长（秒）
            titleDelay: 1.5,        // 标题出现延迟
            subtitleDelay: 0.8,     // 副标题延迟
            hintDelay: 0.5          // 提示延迟
        },
        transition: {
            earthRotation: 1.2,     // 地球旋转时长
            cameraZoom: 1.5,        // 镜头冲刺时长
            fogFade: 0.8            // 云雾出现时长
        },
        ui: {
            fadeDuration: 0.5,      // 界面切换淡入淡出
            cardStagger: 0.1,       // 卡片依次出现间隔
            cardDelay: 0.3          // 卡片整体延迟
        }
    },

    // 转场特效配置
    warp: {
        targetRotationY: 2.83,  // 让中国朝向相机（东经105度）
        targetRotationX: 0.7,   // 轻微向下倾斜
        finalCameraZ: 4.5,      // 冲刺终点
        shakeThreshold: {
            min: 5,
            max: 8
        },
        shakeIntensity: 0.03
    },

    // 纹理资源URL（使用腾讯云COS，国内访问稳定）
    textures: {
        earthMap: 'https://ddcz-1315997005.cos.ap-nanjing.myqcloud.com/static/img/duoduo_guanwang/earth_1.jpg',
        earthSpecular: 'https://ddcz-1315997005.cos.ap-nanjing.myqcloud.com/static/img/duoduo_guanwang/earth_2.jpg',
        earthNormal: 'https://ddcz-1315997005.cos.ap-nanjing.myqcloud.com/static/img/duoduo_guanwang/earth_3.jpg',
        earthClouds: 'https://ddcz-1315997005.cos.ap-nanjing.myqcloud.com/static/img/duoduo_guanwang/earth_4.png'
    },

    // ECharts加载配置
    echarts: {
        loadingText: '正在加载全息数据...',
        loadingColor: '#38bdf8',
        loadingTextColor: '#fff',
        loadingMaskColor: 'rgba(0,0,0,0)'
    },

    // 移动端适配
    mobile: {
        breakpoint: 768,
        touchSensitivity: 1.5,
        gyroscopeSensitivity: 0.5
    }
};
