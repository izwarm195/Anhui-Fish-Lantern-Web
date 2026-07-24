import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCamera(width, height) {
    const camera = new THREE.PerspectiveCamera(
        48,
        width / Math.max(height, 1),
        0.1,
        100
    );

    camera.position.set(1.5, 3.2, 11);
    camera.lookAt(0, 0.5, 0);

    return camera;
}

export function createControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);

    controls.target.set(0, 0.4, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    controls.enablePan = false;
    controls.enableZoom = true;

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;

    controls.minDistance = 4;
    controls.maxDistance = 18;

    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2.05;

    controls.update();

    return controls;
}
