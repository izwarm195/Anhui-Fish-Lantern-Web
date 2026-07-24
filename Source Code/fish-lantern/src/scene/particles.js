import * as THREE from 'three';

function createGlowTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');

    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');

    const gradient = context.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
    );

    gradient.addColorStop(0, 'rgba(255, 238, 180, 1)');
    gradient.addColorStop(0.22, 'rgba(255, 150, 55, 0.82)');
    gradient.addColorStop(0.62, 'rgba(255, 80, 15, 0.10)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

export function createParticles(scene, count = 280) {
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
        const i3 = index * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.8 + Math.random() * 6.3;

        positions[i3] =
            Math.cos(angle) * radius * (0.6 + Math.random() * 0.4);

        positions[i3 + 1] = -1.5 + Math.random() * 5.5;

        positions[i3 + 2] =
            Math.sin(angle) * radius * (0.55 + Math.random() * 0.45);

        const color = new THREE.Color();

        if (Math.random() < 0.55) {
            color.setHSL(0.09, 1, 0.62 + Math.random() * 0.18);
        } else {
            color.setHSL(0.045, 1, 0.52 + Math.random() * 0.18);
        }

        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
    );

    const material = new THREE.PointsMaterial({
        map: createGlowTexture(),
        size: 0.15,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.76,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'GlowParticles';

    scene.add(particles);

    function update(deltaTime, elapsed) {
        particles.rotation.y += deltaTime * 0.035;
        particles.rotation.x =
            Math.sin(elapsed * 0.11) * 0.035;
    }

    function dispose() {
        geometry.dispose();
        material.map?.dispose();
        material.dispose();
        scene.remove(particles);
    }

    return {
        object: particles,
        update,
        dispose
    };
}
