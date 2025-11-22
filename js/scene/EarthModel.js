/* ===================================
   地球模型 - 包含地球、云层、大气层
   =================================== */

import { CONFIG } from '../config.js';

export class EarthModel {
    constructor(scene) {
        this.scene = scene;
        this.earthGroup = new THREE.Group();
        this.earth = null;
        this.clouds = null;
        this.atmosphere = null;
        this.loader = new THREE.TextureLoader();

        this.init();
    }

    // 初始化地球模型
    init() {
        const radius = CONFIG.scene.earth.radius;
        const segments = CONFIG.scene.earth.segments;

        // 创建地球
        this.earth = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, segments),
            new THREE.MeshPhongMaterial({
                map: this.loader.load(CONFIG.textures.earthMap),
                specularMap: this.loader.load(CONFIG.textures.earthSpecular),
                normalMap: this.loader.load(CONFIG.textures.earthNormal),
                specular: new THREE.Color(0x111111),
                shininess: 5
            })
        );
        this.earthGroup.add(this.earth);

        // 创建云层
        this.clouds = new THREE.Mesh(
            new THREE.SphereGeometry(CONFIG.scene.earth.cloudRadius, segments, segments),
            new THREE.MeshLambertMaterial({
                map: this.loader.load(CONFIG.textures.earthClouds),
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            })
        );
        this.earthGroup.add(this.clouds);

        // 创建大气光晕
        this.atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(CONFIG.scene.earth.atmosphereRadius, segments, segments),
            new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main() {
                        float intensity = pow(0.55 - dot(vNormal, vec3(0, 0, 1.0)), 4.5);
                        gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * intensity;
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true
            })
        );

        // 大气层独立添加到场景（不在earthGroup中，避免被旋转）
        this.scene.add(this.atmosphere);
        this.scene.add(this.earthGroup);
    }

    // 自动旋转地球和云层
    rotate() {
        if (this.earthGroup) {
            this.earthGroup.rotation.y += 0.0008;
        }
        if (this.clouds) {
            this.clouds.rotation.y += 0.0010;
        }
    }

    // 获取可交互对象（用于射线检测）
    getInteractiveObjects() {
        return [this.earth, this.clouds];
    }

    // 获取地球组（用于转场旋转）
    getGroup() {
        return this.earthGroup;
    }

    // 获取大气层（用于悬停效果）
    getAtmosphere() {
        return this.atmosphere;
    }

    // 获取云层（用于转场淡出）
    getClouds() {
        return this.clouds;
    }

    // 销毁
    dispose() {
        if (this.earth) {
            this.earth.geometry.dispose();
            this.earth.material.dispose();
        }
        if (this.clouds) {
            this.clouds.geometry.dispose();
            this.clouds.material.dispose();
        }
        if (this.atmosphere) {
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
            this.scene.remove(this.atmosphere);
        }
        if (this.earthGroup) {
            this.scene.remove(this.earthGroup);
        }
    }
}
