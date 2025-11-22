/* ===================================
   星空系统 - 彩色星星点缀
   =================================== */

import { CONFIG } from '../config.js';

export class StarSystem {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.init();
    }

    // 创建星星纹理
    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.Texture(canvas);
    }

    // 初始化星空
    init() {
        const starTexture = this.createStarTexture();
        starTexture.needsUpdate = true;

        const starGeo = new THREE.BufferGeometry();
        const starCount = CONFIG.scene.stars.count;
        const posArray = [];
        const colorArray = [];

        // 颜色调色板
        const palette = CONFIG.scene.stars.colors.map(hex => new THREE.Color(hex));

        // 生成星星位置和颜色
        for (let i = 0; i < starCount; i++) {
            posArray.push(
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 250 - 50
            );
            const c = palette[Math.floor(Math.random() * palette.length)];
            colorArray.push(c.r, c.g, c.b);
        }

        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
        starGeo.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));

        // 自定义着色器材质以支持彩色星星
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: starTexture }
            },
            vertexShader: `
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = ${CONFIG.scene.stars.size} * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        this.stars = new THREE.Points(starGeo, starMaterial);
        this.scene.add(this.stars);
    }

    // 更新（预留）
    update() {
        // 可以在这里添加星星的动态效果，比如闪烁
    }

    // 销毁
    dispose() {
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
            this.scene.remove(this.stars);
        }
    }
}
