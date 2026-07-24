import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export const MODEL_PARTS = [
    {
        key: 'head',
        label: '鱼头',
        skeleton: '/models/鱼头.obj',
        covering: '/models/鱼头裱糊.obj',
        swing: 0.07,
        phase: 0
    },
    {
        key: 'body',
        label: '鱼身',
        skeleton: '/models/鱼身.obj',
        covering: '/models/鱼身裱糊.obj',
        swing: 0.10,
        phase: 0.65
    },
    {
        key: 'back',
        label: '鱼背',
        skeleton: '/models/鱼背.obj',
        covering: '/models/鱼背裱糊.obj',
        swing: 0.17,
        phase: 1.3
    },
    {
        key: 'tail',
        label: '鱼尾',
        skeleton: '/models/鱼尾.obj',
        covering: '/models/鱼尾裱糊.obj',
        swing: 0.28,
        phase: 1.95
    }
];

const COVER_OPACITY = 0.96;
const HIDDEN_OPACITY = 0.035;
const FADE_DURATION = 0.65;

/* ------------------------------------------------------------------ */
/*  工具函数                                                           */
/* ------------------------------------------------------------------ */

function getObjectBounds(object) {
    object.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    return { box, size, center };
}

function disposeMaterial(material) {
    if (!material) return;

    for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
    }

    material.dispose();
}

function applySkeletonMaterial(object) {
    object.traverse((child) => {
        if (!child.isMesh) return;

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
        if (!child.isMesh) return;

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
        if (!child.isMesh) return;

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
        if (!child.isMesh) return;

        child.userData.fishPartKey = key;
        child.userData.fishPartLabel = label;
        child.userData.fishLayer = layer;
    });
}

function loadOBJ(loader, url) {
    return new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
    });
}

function easeInOutCubic(value) {
    if (value < 0.5) return 4 * value * value * value;

    return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function updateCoveringOpacity(part, deltaTime) {
    if (Math.abs(part.currentOpacity - part.targetOpacity) < 0.001) {
        part.currentOpacity = part.targetOpacity;

        return;
    }

    part.fadeElapsed += deltaTime;

    const progress = Math.min(part.fadeElapsed / FADE_DURATION, 1);
    const easedProgress = easeInOutCubic(progress);

    part.currentOpacity = THREE.MathUtils.lerp(
        part.fadeStartOpacity,
        part.targetOpacity,
        easedProgress
    );

    part.coveringMaterials.forEach((material) => {
        material.opacity = part.currentOpacity;
        material.depthWrite = part.currentOpacity > 0.92;
        material.needsUpdate = true;
    });
}

function disposeObject(object) {
    object.traverse((child) => {
        if (!child.isMesh) return;

        child.geometry?.dispose();

        if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial);
        } else {
            disposeMaterial(child.material);
        }
    });
}

/* ------------------------------------------------------------------ */
/*  占位模型（OBJ 加载失败时使用）                                      */
/* ------------------------------------------------------------------ */

function createFallbackPart(config) {
    const skeleton = new THREE.Group();
    const covering = new THREE.Group();

    const widthMap = { head: 1.35, body: 1.8, back: 1.2, tail: 1.25 };
    const width = widthMap[config.key] ?? 1.2;

    const skeletonGeom = new THREE.BoxGeometry(
        width,
        config.key === 'tail' ? 1 : 1.35,
        0.9,
        3,
        3,
        2
    );

    const skeletonMat = new THREE.MeshBasicMaterial({
        color: '#d58743',
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });

    skeleton.add(new THREE.Mesh(skeletonGeom, skeletonMat));

    const coveringGeom = new THREE.BoxGeometry(
        width * 0.96,
        config.key === 'tail' ? 0.94 : 1.29,
        0.86,
        2,
        2,
        2
    );

    const coveringMat = new THREE.MeshStandardMaterial({
        color: '#e55224',
        emissive: '#541405',
        emissiveIntensity: 0.28,
        roughness: 0.52,
        transparent: true,
        opacity: COVER_OPACITY
    });

    covering.add(new THREE.Mesh(coveringGeom, coveringMat));

    return { skeleton, covering, isFallback: true };
}

/* ------------------------------------------------------------------ */
/*  加载单个分段                                                       */
/* ------------------------------------------------------------------ */

async function loadPart(loader, config) {
    let skeleton;
    let covering;
    let isFallback = false;

    try {
        [skeleton, covering] = await Promise.all([
            loadOBJ(loader, config.skeleton),
            loadOBJ(loader, config.covering)
        ]);

        applySkeletonMaterial(skeleton);
        applyCoveringMaterial(covering);
    } catch (error) {
        console.warn(
            `[鱼灯模型] ${config.label} 加载失败，使用占位模型：`,
            error
        );

        const fallback = createFallbackPart(config);

        skeleton = fallback.skeleton;
        covering = fallback.covering;
        isFallback = true;
    }

    /*
     * Blender 默认导出为 Z-up，Three.js 使用 Y-up。
     * 绕 X 轴旋转 +90° 将 Blender Z-up 转换为 Three.js Y-up。
     *
     * 转换后：
     *   Blender X → Three.js X（鱼身长度方向，不变）
     *   Blender Y → Three.js -Z（鱼头朝向变为 -Z）
     *   Blender Z → Three.js Y（向上）
     */
    skeleton.rotation.x = -Math.PI / 2;
    covering.rotation.x = -Math.PI / 2;

    skeleton.name = `${config.label}-骨架`;
    covering.name = `${config.label}-裱糊`;

    markPart(skeleton, config.key, config.label, 'skeleton');
    markPart(covering, config.key, config.label, 'covering');

    /*
     * 骨架与裱糊放入同一个 content 容器。
     * 由于 OBJ 已按 Blender 世界坐标导出，此时 content 内各顶点
     * 即处于正确的相对位置。
     */
    const content = new THREE.Group();
    content.name = `${config.label}-内容`;
    content.add(skeleton);
    content.add(covering);

    content.updateWorldMatrix(true, true);

    const bounds = getObjectBounds(content);
    const center = bounds.center.clone();
    const size = bounds.size.clone();

    /*
     * 创建摆动 pivot，位于该分段的包围盒中心。
     * content 相对 pivot 偏移，使 pivot 成为旋转中心。
     */
    const pivot = new THREE.Group();
    pivot.name = `${config.label}-摆动节点`;

    content.position.set(-center.x, -center.y, -center.z);
    pivot.add(content);
    pivot.position.copy(center);

    const length = Math.max(size.x, size.y, size.z, 0.01);

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
        worldPosition: center.clone(),
        currentOpacity: COVER_OPACITY,
        targetOpacity: COVER_OPACITY,
        fadeStartOpacity: COVER_OPACITY,
        fadeElapsed: 0,
        hidden: false,
        isFallback
    };
}

/* ------------------------------------------------------------------ */
/*  创建完整鱼灯模型（唯一对外入口）                                     */
/* ------------------------------------------------------------------ */

export async function createLanternModel(options = {}) {
    const { onFileProgress, onPartToggle } = options;

    const loader = new OBJLoader();

    const root = new THREE.Group();
    root.name = 'FishLantern';

    const modelRoot = new THREE.Group();
    modelRoot.name = 'FishLanternModelRoot';
    root.add(modelRoot);

    /* ---------- 顺序加载四个分段 ---------- */

    const parts = [];

    for (let index = 0; index < MODEL_PARTS.length; index += 1) {
        const config = MODEL_PARTS[index];

        onFileProgress?.(
            index / MODEL_PARTS.length,
            config.skeleton.split('/').pop()
        );

        const part = await loadPart(loader, config);

        parts.push(part);
        modelRoot.add(part.pivot);

        onFileProgress?.(
            (index + 1) / MODEL_PARTS.length,
            config.covering.split('/').pop()
        );
    }

    /* ---------- 计算身体轴向 ---------- */

    modelRoot.updateWorldMatrix(true, true);

    const headPos = parts[0].worldPosition.clone();
    const tailPos = parts[parts.length - 1].worldPosition.clone();

    const bodyDirection = tailPos.clone().sub(headPos);

    const bodyLength = bodyDirection.length();

    if (bodyLength > 0.001) {
        bodyDirection.normalize();
    } else {
        /*
         * 如果所有分段重叠（例如占位模型），回退到 X 轴。
         */
        bodyDirection.set(1, 0, 0);
    }

    /*
     * 计算每个分段在身体轴向上的投影，
     * 用于摆动时确定相位偏移。
     */
    const bodyProjections = parts.map((part) =>
        bodyDirection.dot(
            part.worldPosition.clone().sub(headPos)
        )
    );

    const maxProjection =
        bodyProjections[bodyProjections.length - 1] || 1;

    /* ---------- 整体缩放 ---------- */

    const overallBounds = new THREE.Box3().setFromObject(modelRoot);
    const overallSize = overallBounds.getSize(new THREE.Vector3());

    const desiredLength = 6;
    const dominantAxis = Math.max(
        overallSize.x,
        overallSize.y,
        overallSize.z
    );

    const scale = dominantAxis > 0
        ? desiredLength / dominantAxis
        : 1;

    modelRoot.scale.setScalar(scale);
    modelRoot.updateWorldMatrix(true, true);

    /* ---------- 居中 ---------- */

    const finalBounds = new THREE.Box3().setFromObject(modelRoot);
    const finalCenter = finalBounds.getCenter(new THREE.Vector3());

    modelRoot.position.set(
        -finalCenter.x,
        -finalCenter.y,
        -finalCenter.z
    );

    /*
     * （可选）旋转整条鱼，使鱼头朝向摄像机。
     * 当前鱼头在 Blender 中朝向 Y+，经 Z→Y 转换后朝向 -Z。
     * 取消下面注释可将鱼头旋转至 +Z（面向观察者）：
     *
     * modelRoot.rotation.y = Math.PI;
     */

    /* ---------- 可点击对象收集 ---------- */

    const clickableObjects = [];

    parts.forEach((part) => {
        part.skeleton.traverse((child) => {
            if (child.isMesh) clickableObjects.push(child);
        });

        part.covering.traverse((child) => {
            if (child.isMesh) clickableObjects.push(child);
        });
    });

    /* ---------- 交互方法 ---------- */

    function getPart(partKey) {
        return parts.find((part) => part.key === partKey);
    }

    function setPartHidden(partKey, hidden) {
        const part = getPart(partKey);

        if (!part) return null;

        part.hidden = hidden;
        part.fadeStartOpacity = part.currentOpacity;
        part.targetOpacity = hidden ? HIDDEN_OPACITY : COVER_OPACITY;
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

        if (!part) return null;

        return setPartHidden(partKey, !part.hidden);
    }

    function showAllCoverings() {
        parts.forEach((part) => setPartHidden(part.key, false));
    }

    function hideAllCoverings() {
        parts.forEach((part) => setPartHidden(part.key, true));
    }

    /* ---------- 每帧更新 ---------- */

    function update(deltaTime, elapsed) {
        /*
         * 整体浮动。
         */
        root.position.y = 0.45 + Math.sin(elapsed * 1.15) * 0.12;
        root.rotation.z = Math.sin(elapsed * 0.48) * 0.025;

        /*
        * 四段波浪摆动。
        *
        * 相邻分段摆动方向相反：鱼头顺时针时鱼身逆时针，
        * 以此类推，模拟真实游动姿态。
        */
        parts.forEach((part, index) => {
            const projection =
                maxProjection > 0
                    ? bodyProjections[index] / maxProjection
                    : index / Math.max(parts.length - 1, 1);

            const phaseOffset =
                projection * (MODEL_PARTS.length - 1) * 0.72;

            const wave = elapsed * 1.7 - phaseOffset + part.config.phase;

            /*
            * 偶数索引正向摆动，奇数索引反向摆动。
            */
            const direction = index % 2 === 0 ? 1 : -1;

            part.pivot.rotation.y =
                Math.sin(wave) * part.config.swing * direction;

            part.pivot.rotation.x =
                Math.cos(wave * 0.86) * part.config.swing * 0.14 * direction;

            updateCoveringOpacity(part, deltaTime);
        });

    }

    function dispose() {
        disposeObject(root);

        if (root.parent) root.parent.remove(root);

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
