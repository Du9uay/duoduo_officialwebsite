/* ===================================
   3D场景管理器 - 主控制器
   =================================== */

import { CONFIG } from '../config.js';
import { StarSystem } from './StarSystem.js';
import { EarthModel } from './EarthModel.js';
import { Transition } from './Transition.js';

export class SceneManager {
    constructor(container, onTransitionComplete) {
        this.container = container;
        this.onTransitionComplete = onTransitionComplete;

        // 状态标志
        this.isIntro = true;
        this.isHovering = false;
        this.parallaxX = 0;
        this.parallaxY = 0;

        // Three.js核心对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 子系统
        this.starSystem = null;
        this.earthModel = null;
        this.transition = null;

        this.init();
    }

    // 初始化场景
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(CONFIG.scene.fog.color, CONFIG.scene.fog.density);

        // 创建相机
        const camConfig = CONFIG.scene.camera;
        this.camera = new THREE.PerspectiveCamera(
            camConfig.fov,
            window.innerWidth / window.innerHeight,
            camConfig.near,
            camConfig.far
        );
        this.camera.position.z = camConfig.initialZ; // 开场动画：从深空开始

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1); // 设置黑色背景
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // 创建星空系统
        this.starSystem = new StarSystem(this.scene);

        // 创建地球模型
        this.earthModel = new EarthModel(this.scene);

        // 添加灯光
        this.setupLights();

        // 绑定事件
        this.bindEvents();

        // 启动动画循环
        this.animate();
    }

    // 设置灯光
    setupLights() {
        const lights = CONFIG.scene.lights;

        // 环境光
        this.scene.add(new THREE.AmbientLight(lights.ambient));

        // 太阳光
        const sunLight = new THREE.DirectionalLight(lights.sun.color, lights.sun.intensity);
        sunLight.position.set(...lights.sun.position);
        this.scene.add(sunLight);

        // 边缘光
        const rimLight = new THREE.SpotLight(lights.rim.color, lights.rim.intensity);
        rimLight.position.set(...lights.rim.position);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
    }

    // 开场动画
    startIntroSequence(uiElements) {
        const animConfig = CONFIG.animation.intro;

        const tl = gsap.timeline({
            onComplete: () => {
                this.isIntro = false; // 动画结束，允许交互
            }
        });

        // A. 摄像机缓慢推进 (从 z=100 -> z=16)
        tl.to(this.camera.position, {
            z: CONFIG.scene.camera.defaultZ,
            duration: animConfig.cameraDuration,
            ease: "power2.out"
        });

        // B. UI 淡入 (标题和提示依次出现)
        tl.to('.v1-title', {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
        }, `-=${animConfig.titleDelay}`);

        tl.to('.v1-subtitle', {
            opacity: 1,
            duration: 1.2,
            ease: "power2.out"
        }, `-=${animConfig.subtitleDelay}`);

        tl.to('.instruction-hint', {
            opacity: 1,
            duration: 1.0,
            ease: "power2.out"
        }, `-=${animConfig.hintDelay}`);
    }

    // 初始化转场系统
    initTransition(uiElements) {
        this.transition = new Transition(
            this.camera,
            this.earthModel,
            uiElements,
            this.onTransitionComplete
        );
    }

    // 绑定事件
    bindEvents() {
        // 鼠标移动
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // 鼠标点击
        window.addEventListener('mousedown', () => this.onMouseDown());

        // 触摸移动（移动端）
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });

        // 触摸点击（移动端）
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));

        // 窗口resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    // 鼠标移动事件
    onMouseMove(e) {
        if (this.transition && this.transition.isActive()) return;

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // 只有开场动画结束后才检测悬停
        if (!this.isIntro) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(
                this.earthModel.getInteractiveObjects()
            );

            if (intersects.length > 0) {
                if (!this.isHovering) {
                    this.isHovering = true;
                    this.container.classList.add('interactive');
                    gsap.to(this.earthModel.getAtmosphere().scale, {
                        x: 1.03,
                        y: 1.03,
                        z: 1.03,
                        duration: 0.3
                    });
                }
            } else {
                if (this.isHovering) {
                    this.isHovering = false;
                    this.container.classList.remove('interactive');
                    gsap.to(this.earthModel.getAtmosphere().scale, {
                        x: 1,
                        y: 1,
                        z: 1,
                        duration: 0.3
                    });
                }
            }
        }

        // 视差效果
        this.parallaxX = (e.clientX - window.innerWidth / 2) * 0.001;
        this.parallaxY = (e.clientY - window.innerHeight / 2) * 0.001;
    }

    // 鼠标点击事件
    onMouseDown() {
        if (this.isIntro || !this.isHovering) return;
        if (this.transition && this.transition.isActive()) return;

        // 触发转场
        if (this.transition) {
            this.transition.trigger();
        }
    }

    // 触摸移动事件（移动端）
    onTouchMove(e) {
        if (this.transition && this.transition.isActive()) return;

        const touch = e.touches[0];
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        // 视差效果
        this.parallaxX = (touch.clientX - window.innerWidth / 2) * 0.001;
        this.parallaxY = (touch.clientY - window.innerHeight / 2) * 0.001;
    }

    // 触摸点击事件（移动端）
    onTouchStart(e) {
        if (this.isIntro) return;
        if (this.transition && this.transition.isActive()) return;

        const touch = e.touches[0];
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        // 检测是否点击地球
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.earthModel.getInteractiveObjects()
        );

        if (intersects.length > 0) {
            // 触发转场
            if (this.transition) {
                this.transition.trigger();
            }
        }
    }

    // 窗口resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // 动画循环
    animate() {
        requestAnimationFrame(() => this.animate());

        // 如果不在转场中
        if (!this.transition || !this.transition.isActive()) {
            // 地球和云层旋转
            this.earthModel.rotate();

            // 只有开场动画结束后才启用视差效果
            if (!this.isIntro) {
                this.camera.position.x += (this.parallaxX * 8 - this.camera.position.x) * 0.05;
                this.camera.position.y += (-this.parallaxY * 8 - this.camera.position.y) * 0.05;
                this.camera.lookAt(0, 0, 0);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    // 销毁场景
    dispose() {
        if (this.starSystem) this.starSystem.dispose();
        if (this.earthModel) this.earthModel.dispose();
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }
}
