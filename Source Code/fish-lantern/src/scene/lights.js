import * as THREE from 'three';

export function createLights(scene) {
    const root = new THREE.Group();
    root.name = 'FishLanternLights';

    const ambientLight = new THREE.AmbientLight('#4d2412', 1.4);
    root.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(
        '#ffd4a8',
        '#120508',
        1.2
    );
    root.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight('#ffe5c4', 3.3);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;

    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.025;

    root.add(keyLight);

    const frontGlow = new THREE.PointLight('#ff7b22', 52, 11, 1.7);
    frontGlow.position.set(0, 1.3, 2.5);
    frontGlow.castShadow = true;
    frontGlow.shadow.mapSize.set(1024, 1024);
    root.add(frontGlow);

    const rearGlow = new THREE.PointLight('#ffad58', 30, 9, 2);
    rearGlow.position.set(-3.2, 0.5, -2);
    root.add(rearGlow);

    const rimLight = new THREE.PointLight('#ffcf8a', 26, 10, 2);
    rimLight.position.set(4, 2.4, -1.6);
    root.add(rimLight);

    scene.add(root);

    function update(elapsed) {
        frontGlow.intensity = 52 * (
            1 + Math.sin(elapsed * 1.55) * 0.16
        );

        rearGlow.intensity = 30 * (
            1 + Math.cos(elapsed * 1.2 + 0.8) * 0.12
        );
    }

    return {
        root,
        ambientLight,
        hemisphereLight,
        keyLight,
        frontGlow,
        rearGlow,
        rimLight,
        update
    };
}
