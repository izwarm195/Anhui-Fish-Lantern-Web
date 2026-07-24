import * as THREE from 'three';

import { createCamera, createControls } from './camera.js';
import { createLights } from './lights.js';
import { createParticles } from './particles.js';
import { createLanternModel } from './lanternModel.js';

export class FishLanternScene {
    constructor(container, options = {}) {
        if (!container) {
            throw new Error('缺少 Three.js 场景容器');
        }

        this.container = container;
        this.options = options;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.lights = null;
        this.particles = null;
        this.lantern = null;

        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.animationFrame = 0;
        this.destroyed = false;
        this.pointerDownPosition = null;

        this.handleResize = this.handleResize.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.animate = this.animate.bind(this);
    }

    async init() {
        this.createScene();
        this.createRenderer();

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera = createCamera(width, height);
        this.controls = createControls(
            this.camera,
            this.renderer.domElement
        );

        this.lights = createLights(this.scene);
        this.particles = createParticles(this.scene);

        this.createGround();
        this.bindEvents();

        /*
         * 先启动渲染循环，让加载模型期间仍能看到背景和粒子。
         */
        this.clock.start();
        this.animate();

        try {
            this.lantern = await createLanternModel({
                onFileProgress: (urlOrProgress, fileProgress) => {
                    /*
                     * loadPart 内既可能传递整体进度，
                     * 也可能传递 URL 与单文件进度。
                     */
                    if (typeof urlOrProgress === 'number') {
                        this.options.onProgress?.(
                            urlOrProgress,
                            fileProgress
                        );
                        return;
                    }

                    const fileName = decodeURIComponent(
                        String(urlOrProgress).split('/').pop()
                    );

                    /*
                     * OBJLoader 的单文件进度不能直接代表八个模型的
                     * 总进度，因此这里只用于更新加载文件名称。
                     */
                    this.options.onProgress?.(
                        Math.min(fileProgress ?? 0, 0.95),
                        fileName
                    );
                },

                onPartToggle: (detail) => {
                    this.options.onPartToggle?.(detail);
                }
            });

            if (this.destroyed) {
                this.lantern.dispose();
                return;
            }

            this.scene.add(this.lantern.root);
            this.options.onReady?.(this.lantern);
        } catch (error) {
            this.options.onError?.(error);
        }
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#07060d');
        this.scene.fog = new THREE.Fog('#07060d', 9, 28);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(
            this.container.clientWidth || window.innerWidth,
            this.container.clientHeight || window.innerHeight
        );

        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.12;

        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.renderer.domElement.className = 'scene-canvas';
        this.renderer.domElement.setAttribute(
            'aria-label',
            '可拖动旋转的徽州鱼灯三维模型'
        );

        this.container.appendChild(this.renderer.domElement);
    }

    createGround() {
        const geometry = new THREE.PlaneGeometry(24, 24);

        const material = new THREE.MeshStandardMaterial({
            color: '#0b0910',
            roughness: 0.96,
            metalness: 0
        });

        this.ground = new THREE.Mesh(geometry, material);
        this.ground.name = 'Ground';
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -2.15;
        this.ground.receiveShadow = true;

        this.scene.add(this.ground);

        const glowGeometry = new THREE.CircleGeometry(4.2, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: '#8c2e0c',
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.groundGlow = new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

        this.groundGlow.rotation.x = -Math.PI / 2;
        this.groundGlow.position.y = -2.13;

        this.scene.add(this.groundGlow);
    }

    bindEvents() {
        window.addEventListener('resize', this.handleResize);

        const canvas = this.renderer.domElement;

        canvas.addEventListener(
            'pointermove',
            this.handlePointerMove
        );

        canvas.addEventListener(
            'pointerdown',
            this.handlePointerDown
        );

        canvas.addEventListener(
            'pointerup',
            this.handlePointerUp
        );
    }

    unbindEvents() {
        window.removeEventListener('resize', this.handleResize);

        if (!this.renderer) {
            return;
        }

        const canvas = this.renderer.domElement;

        canvas.removeEventListener(
            'pointermove',
            this.handlePointerMove
        );

        canvas.removeEventListener(
            'pointerdown',
            this.handlePointerDown
        );

        canvas.removeEventListener(
            'pointerup',
            this.handlePointerUp
        );
    }

    handleResize() {
        if (!this.camera || !this.renderer) {
            return;
        }

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera.aspect = width / Math.max(height, 1);
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );
    }

    updatePointer(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();

        this.pointer.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;

        this.pointer.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getIntersection(event) {
        if (!this.lantern || !this.camera) {
            return null;
        }

        this.updatePointer(event);

        this.raycaster.setFromCamera(
            this.pointer,
            this.camera
        );

        const intersections = this.raycaster.intersectObjects(
            this.lantern.clickableObjects,
            false
        );

        return intersections[0] ?? null;
    }

    handlePointerMove(event) {
        const intersection = this.getIntersection(event);

        this.renderer.domElement.style.cursor = intersection
            ? 'pointer'
            : 'grab';
    }

    handlePointerDown(event) {
        this.pointerDownPosition = {
            x: event.clientX,
            y: event.clientY
        };

        this.renderer.domElement.style.cursor = 'grabbing';
    }

    handlePointerUp(event) {
        const down = this.pointerDownPosition;
        this.pointerDownPosition = null;

        if (!down) {
            return;
        }

        /*
         * OrbitControls 拖拽结束不应被识别为点击。
         */
        const distance = Math.hypot(
            event.clientX - down.x,
            event.clientY - down.y
        );

        if (distance > 6) {
            this.renderer.domElement.style.cursor = 'grab';
            return;
        }

        const intersection = this.getIntersection(event);

        if (!intersection) {
            this.renderer.domElement.style.cursor = 'grab';
            return;
        }

        const partKey =
            intersection.object.userData.fishPartKey;

        if (partKey) {
            this.lantern.togglePart(partKey);
        }

        this.renderer.domElement.style.cursor = 'pointer';
    }

    animate() {
        if (this.destroyed) {
            return;
        }

        this.animationFrame = window.requestAnimationFrame(
            this.animate
        );

        const deltaTime = Math.min(
            this.clock.getDelta(),
            0.1
        );

        const elapsed = this.clock.elapsedTime;

        this.controls?.update();
        this.lights?.update(elapsed);
        this.particles?.update(deltaTime, elapsed);
        this.lantern?.update(deltaTime, elapsed);

        if (this.groundGlow) {
            this.groundGlow.material.opacity =
                0.1 + Math.sin(elapsed * 1.3) * 0.025;
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.destroyed = true;

        window.cancelAnimationFrame(this.animationFrame);
        this.unbindEvents();

        this.controls?.dispose();
        this.particles?.dispose();
        this.lantern?.dispose();

        if (this.ground) {
            this.ground.geometry.dispose();
            this.ground.material.dispose();
            this.scene.remove(this.ground);
        }

        if (this.groundGlow) {
            this.groundGlow.geometry.dispose();
            this.groundGlow.material.dispose();
            this.scene.remove(this.groundGlow);
        }

        this.renderer?.dispose();
        this.renderer?.domElement.remove();

        this.scene?.clear();
    }
}
