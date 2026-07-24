import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export const MODEL_PARTS = [
    {
        key: 'head',
        label: '鱼头',
        skeleton: '/models/鱼头.obj',
        covering: '/models/鱼头裱糊.obj',
        gap: 0.02,
        swing: 0.07,
        phase: 0
    },
    {
        key: 'body',
        label: '鱼身',
        skeleton: '/models/鱼身.obj',
        covering: '/models/鱼身裱糊.obj',
        gap: 0.02,
        swing: 0.10,
        phase: 0.65
    },
    {
        key: 'back',
        label: '鱼背',
        skeleton: '/models/鱼背.obj',
        covering: '/models/鱼背裱糊.obj',
        gap: 0.02,
        swing: 0.17,
        phase: 1.3
    },
    {
        key: 'tail',
        label: '鱼尾',
        skeleton: '/models/鱼尾.obj',
        covering: '/models/鱼尾裱糊.obj',
        gap: 0.02,
        swing: 0.28,
        phase: 1.95
    }
];

const COVER_OPACITY = 0.96;
const HIDDEN_OPACITY = 0.035;
const FADE_DURATION = 0.65;

function getObjectBounds(object) {
    object.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    return {
        box,
        size,
        center
    };
}

function disposeMaterial(material) {
    if (!material) {
        return;
    }

    for (const value of Object.values(material)) {
        if (value?.isTexture) {
            value.dispose();
        }
    }

    material.dispose();
}

function applySkeletonMaterial(object) {
    object.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        child.geometry.computeVertexNormals();

        child.material = new THREE.MeshStandardMaterial({
            color: '#9b5a2d',
            roughness: 0.78,
            metalness: 0.02,
            emissive: '#351407',
            emissiveIntensity: 0.15,
            side: THREE.DoubleSide
        });

        child.castShadow = true;
        child.receiveShadow = true;

        child.userData.clickableFishPart = true;
    });
}

function applyCoveringMaterial(object) {
    object.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        child.geometry.computeVertexNormals();

        child.material = new THREE.MeshPhysicalMaterial({
            color: '#e55524',
            roughness: 0.52,
            metalness: 0,
            transmission: 0,
            transparent: true,
            opacity: COVER_OPACITY,
            alphaTest: 0.01,
            depthWrite: true,
            side: THREE.DoubleSide,
            emissive: '#5c1605',
            emissiveIntensity: 0.32,
            clearcoat: 0.12,
            clearcoatRoughness: 0.65
        });

        child.castShadow = true;
        child.receiveShadow = true;

        child.userData.clickableFishPart = true;
    });
}

function collectMaterials(object) {
    const materials = [];

    object.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        if (Array.isArray(child.material)) {
            materials.push(...child.material);
        } else if (child.material) {
            materials.push(child.material);
        }
    });

    return materials;
}

function markPart(object, key, label, layer) {
    object.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        child.userData.fishPartKey = key;
        child.userData.fishPartLabel = label;
        child.userData.fishLayer = layer;
    });
}

function loadOBJ(loader, url, manager) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            resolve,
            (event) => {
                if (!event.lengthComputable) {
                    return;
                }

                manager?.onFileProgress?.(
                    url,
                    event.loaded / event.total
                );
            },
            reject
        );
    });
}

/**
 * 把模型原点移动到自身包围盒中心。
 *
 * 这里不直接修改 geometry，而是移动 OBJ 根对象，
 * 避免多个 Mesh 时分别计算产生偏差。
 */
function centerObject(object) {
    const { center } = getObjectBounds(object);

    object.position.sub(center);
    object.updateMatrixWorld(true);
}

/**
 * 默认假设鱼的首尾方向沿模型局部 X 轴。
 *
 * 每个分段的中心按自身宽度自动排列，从而首尾相接。
 * 若建模软件导出的首尾方向不是 X 轴，应在 Blender 等软件中
 * 统一坐标轴，或修改这里的排列算法。
 */
function arrangePartPivots(parts) {
    const totalWidth = parts.reduce(
        (sum, part) => sum + part.length + part.config.gap,
        0
    );

    let cursor = -totalWidth / 2;

    for (const part of parts) {
        const centerX = cursor + part.length / 2;

        part.basePosition.set(centerX, 0, 0);
        part.pivot.position.copy(part.basePosition);

        cursor += part.length + part.config.gap;
    }
}

function createFallbackPart(config) {
    const skeleton = new THREE.Group();
    const covering = new THREE.Group();

    const widthMap = {
        head: 1.35,
        body: 1.8,
        back: 1.2,
        tail: 1.25
    };

    const width = widthMap[config.key] ?? 1.2;

    const skeletonGeometry = new THREE.BoxGeometry(
        width,
        config.key === 'tail' ? 1 : 1.35,
        0.9,
        3,
        3,
        2
    );

    const skeletonMaterial = new THREE.MeshBasicMaterial({
        color: '#d58743',
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });

    skeleton.add(
        new THREE.Mesh(skeletonGeometry, skeletonMaterial)
    );

    const coveringGeometry = new THREE.BoxGeometry(
        width * 0.96,
        config.key === 'tail' ? 0.94 : 1.29,
        0.86,
        2,
        2,
        2
    );

    const coveringMaterial = new THREE.MeshStandardMaterial({
        color: '#e55224',
        emissive: '#541405',
        emissiveIntensity: 0.28,
        roughness: 0.52,
        transparent: true,
        opacity: COVER_OPACITY
    });

    covering.add(
        new THREE.Mesh(coveringGeometry, coveringMaterial)
    );

    return {
        skeleton,
        covering,
        isFallback: true
    };
}

 async function loadPart(loader, config, progressManager) {
    let skeleton;
    let covering;
    let isFallback = false;

    try {
        [skeleton, covering] = await Promise.all([
            loadOBJ(loader, config.skeleton, progressManager),
            loadOBJ(loader, config.covering, progressManager)
        ]);

        applySkeletonMaterial(skeleton);
        applyCoveringMaterial(covering);
    } catch (error) {
        console.warn(
            `[鱼灯模型] ${config.label}加载失败，使用占位模型：`,
            error
        );

        const fallback = createFallbackPart(config);

        skeleton = fallback.skeleton;
        covering = fallback.covering;
        isFallback = true;
    }

    skeleton.name = `${config.label}-骨架`;
    covering.name = `${config.label}-裱糊`;

    /*
     * 每个 OBJ 单独居中，然后放入同一个 content 容器。
     * 前提是同一分段的骨架和裱糊模型具有一致的尺寸与导出方向。
     */
    centerObject(skeleton);
    centerObject(covering);

    markPart(skeleton, config.key, config.label, 'skeleton');
    markPart(covering, config.key, config.label, 'covering');

    const content = new THREE.Group();
    content.name = `${config.label}-内容`;
    content.add(skeleton);
    content.add(covering);

    /*
     * pivot 是摆动轴。当前默认位于每段中心；
     * 后续 arrangePartPivots 会按 X 轴顺序排列四段。
     */
    const pivot = new THREE.Group();
    pivot.name = `${config.label}-摆动节点`;
    pivot.add(content);

    const skeletonBounds = getObjectBounds(skeleton);
    const coveringBounds = getObjectBounds(covering);

    const length = Math.max(
        skeletonBounds.size.x,
        coveringBounds.size.x,
        0.01
    );

    const coveringMaterials = collectMaterials(covering);

    coveringMaterials.forEach((material) => {
        material.transparent = true;
        material.opacity = COVER_OPACITY;
        material.depthWrite = true;
        material.needsUpdate = true;
    });

    return {
        key: config.key,
        label: config.label,
        config,
        pivot,
        content,
        skeleton,
        covering,
        coveringMaterials,
        length,
        basePosition: new THREE.Vector3(),
        currentOpacity: COVER_OPACITY,
        targetOpacity: COVER_OPACITY,
        fadeStartOpacity: COVER_OPACITY,
        fadeElapsed: 0,
        hidden: false,
        isFallback
    };
}

function easeInOutCubic(value) {
    if (value < 0.5) {
        return 4 * value * value * value;
    }

    return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function updateCoveringOpacity(part, deltaTime) {
    if (Math.abs(part.currentOpacity - part.targetOpacity) < 0.001) {
        part.currentOpacity = part.targetOpacity;
        return;
    }

    part.fadeElapsed += deltaTime;

    const progress = Math.min(
        part.fadeElapsed / FADE_DURATION,
        1
    );

    const easedProgress = easeInOutCubic(progress);

    part.currentOpacity = THREE.MathUtils.lerp(
        part.fadeStartOpacity,
        part.targetOpacity,
        easedProgress
    );

    part.coveringMaterials.forEach((material) => {
        material.opacity = part.currentOpacity;

        /*
         * 渐隐期间关闭 depthWrite，避免透明表面遮挡骨架；
         * 恢复到接近不透明时重新开启深度写入。
         */
        material.depthWrite = part.currentOpacity > 0.92;
        material.needsUpdate = true;
    });
}

function disposeObject(object) {
    object.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        child.geometry?.dispose();

        if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial);
        } else {
            disposeMaterial(child.material);
        }
    });
}

/**
 * 加载并创建完整鱼灯。
 *
 * 对外返回：
 * - root：加入场景的总容器
 * - clickableObjects：供 Raycaster 检测
 * - update：每帧更新摆动及透明动画
 * - togglePart：切换某一段裱糊
 * - dispose：释放模型资源
 */
export async function createLanternModel(options = {}) {
    const {
        onFileProgress,
        onPartToggle
    } = options;

    const loader = new OBJLoader();

    const root = new THREE.Group();
    root.name = 'FishLantern';

    /*
     * modelRoot 用于整体浮动。
     * 四个分段的 pivot 都加入这个节点。
     */
    const modelRoot = new THREE.Group();
    modelRoot.name = 'FishLanternModelRoot';
    root.add(modelRoot);

    const progressManager = {
        onFileProgress
    };

    const parts = [];

    /*
     * 顺序加载可以保证进度提示与模型顺序一致，
     * 也能降低同时解析多个大型 OBJ 时的内存峰值。
     */
    for (let index = 0; index < MODEL_PARTS.length; index += 1) {
        const config = MODEL_PARTS[index];

        onFileProgress?.(
            index / MODEL_PARTS.length,
            config.skeleton.split('/').pop()
        );

        const part = await loadPart(
            loader,
            config,
            progressManager
        );

        parts.push(part);
        modelRoot.add(part.pivot);

        onFileProgress?.(
            (index + 1) / MODEL_PARTS.length,
            config.covering.split('/').pop()
        );
    }

    arrangePartPivots(parts);

    /*
     * 根据完整鱼灯尺寸自动缩放，防止不同建模单位导致
     * 模型过大、过小或超出镜头。
     */
    modelRoot.updateWorldMatrix(true, true);

    const boundsBeforeScale = new THREE.Box3().setFromObject(modelRoot);
    const sizeBeforeScale = boundsBeforeScale.getSize(
        new THREE.Vector3()
    );

    const desiredLength = 6;
    const scale = sizeBeforeScale.x > 0
        ? desiredLength / sizeBeforeScale.x
        : 1;

    modelRoot.scale.setScalar(scale);
    modelRoot.updateWorldMatrix(true, true);

    /*
     * 缩放后将整条鱼灯放到场景中心。
     */
    const finalBounds = new THREE.Box3().setFromObject(modelRoot);
    const finalCenter = finalBounds.getCenter(new THREE.Vector3());

    modelRoot.position.x -= finalCenter.x;
    modelRoot.position.y -= finalCenter.y;
    modelRoot.position.z -= finalCenter.z;

    /*
     * 当前模型默认鱼头在 X 轴负方向、鱼尾在正方向。
     * 如果模型显示方向相反，可启用下一行：
     *
     * modelRoot.rotation.y = Math.PI;
     */

    const clickableObjects = [];

    parts.forEach((part) => {
        part.skeleton.traverse((child) => {
            if (child.isMesh) {
                clickableObjects.push(child);
            }
        });

        part.covering.traverse((child) => {
            if (child.isMesh) {
                clickableObjects.push(child);
            }
        });
    });

    function getPart(partKey) {
        return parts.find((part) => part.key === partKey);
    }

    function setPartHidden(partKey, hidden) {
        const part = getPart(partKey);

        if (!part) {
            return null;
        }

        part.hidden = hidden;
        part.fadeStartOpacity = part.currentOpacity;
        part.targetOpacity = hidden
            ? HIDDEN_OPACITY
            : COVER_OPACITY;
        part.fadeElapsed = 0;

        const detail = {
            key: part.key,
            label: part.label,
            hidden: part.hidden
        };

        onPartToggle?.(detail);

        return detail;
    }

    function togglePart(partKey) {
        const part = getPart(partKey);

        if (!part) {
            return null;
        }

        return setPartHidden(partKey, !part.hidden);
    }

    function showAllCoverings() {
        parts.forEach((part) => {
            setPartHidden(part.key, false);
        });
    }

    function hideAllCoverings() {
        parts.forEach((part) => {
            setPartHidden(part.key, true);
        });
    }

    function update(deltaTime, elapsed) {
        /*
         * 整体缓慢浮动。
         */
        root.position.y = 0.45 + Math.sin(elapsed * 1.15) * 0.12;
        root.rotation.z = Math.sin(elapsed * 0.48) * 0.025;

        /*
         * 四段产生逐渐增强的波浪摆动。
         * 鱼头最稳定，鱼尾摆幅最大。
         *
         * rotation.y：左右摆动
         * rotation.z：轻微上下扭动
         */
        parts.forEach((part, index) => {
            const wave =
                elapsed * 1.7 -
                index * 0.72 +
                part.config.phase;

            part.pivot.rotation.y =
                Math.sin(wave) * part.config.swing;

            part.pivot.rotation.z =
                Math.cos(wave * 0.86) *
                part.config.swing *
                0.24;

            updateCoveringOpacity(part, deltaTime);
        });
    }

    function dispose() {
        disposeObject(root);

        if (root.parent) {
            root.parent.remove(root);
        }

        parts.length = 0;
        clickableObjects.length = 0;
    }

    return {
        root,
        modelRoot,
        parts,
        clickableObjects,
        update,
        getPart,
        togglePart,
        setPartHidden,
        showAllCoverings,
        hideAllCoverings,
        dispose
    };
}
               