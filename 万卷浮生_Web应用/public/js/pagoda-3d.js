import * as THREE from '/js/three.module.js';
import { OBJLoader } from '/js/OBJLoader.js';
import { MTLLoader } from '/js/MTLLoader.js';

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('pagoda-3d-container');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.006);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 30);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.pointerEvents = 'none';

    const ambientLight = new THREE.AmbientLight(0x554433, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffd700, 1.0);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xffd700, 0.6, 60);
    pointLight1.position.set(-10, 8, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffa500, 0.4, 45);
    pointLight2.position.set(10, 5, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x00ffff, 0.25, 50);
    pointLight3.position.set(-5, 12, -5);
    scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0x8b5cf6, 0.2, 40);
    pointLight4.position.set(5, 10, 5);
    scene.add(pointLight4);

    const emissiveLight = new THREE.PointLight(0xffec8b, 0.5, 35);
    emissiveLight.position.set(0, 7, 0);
    scene.add(emissiveLight);

    const lanternLight1 = new THREE.PointLight(0xff4500, 0.8, 20);
    lanternLight1.position.set(-6, 4, 0);
    scene.add(lanternLight1);

    const lanternLight2 = new THREE.PointLight(0xff4500, 0.8, 20);
    lanternLight2.position.set(6, 4, 0);
    scene.add(lanternLight2);

    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 40;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        
        particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
        particleVelocities[i * 3 + 1] = Math.random() * 0.03 + 0.01;
        particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        
        particleSizes[i] = Math.random() * 2 + 0.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const particleCtx = particleCanvas.getContext('2d');
    const gradient = particleCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    particleCtx.fillStyle = gradient;
    particleCtx.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const particleMaterial = new THREE.PointsMaterial({
        map: particleTexture,
        color: 0xffffff,
        size: 0.4,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        alphaTest: 0.1
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const orbParticleCount = 80;
    const orbGeometry = new THREE.BufferGeometry();
    const orbPositions = new Float32Array(orbParticleCount * 3);
    const orbSizes = new Float32Array(orbParticleCount);

    for (let i = 0; i < orbParticleCount; i++) {
        const radius = Math.random() * 8 + 6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        orbPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        orbPositions[i * 3 + 1] = radius * Math.cos(phi) + 4;
        orbPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        
        orbSizes[i] = Math.random() * 3 + 1;
    }

    orbGeometry.setAttribute('position', new THREE.BufferAttribute(orbPositions, 3));
    orbGeometry.setAttribute('size', new THREE.BufferAttribute(orbSizes, 1));

    const orbCanvas = document.createElement('canvas');
    orbCanvas.width = 64;
    orbCanvas.height = 64;
    const orbCtx = orbCanvas.getContext('2d');
    const orbGradient = orbCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    orbGradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
    orbGradient.addColorStop(0.4, 'rgba(0, 255, 255, 0.6)');
    orbGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    orbCtx.fillStyle = orbGradient;
    orbCtx.fillRect(0, 0, 64, 64);
    const orbTexture = new THREE.CanvasTexture(orbCanvas);

    const orbMaterial = new THREE.PointsMaterial({
        map: orbTexture,
        color: 0xffffff,
        size: 0.6,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        alphaTest: 0.1
    });

    const orbParticles = new THREE.Points(orbGeometry, orbMaterial);
    scene.add(orbParticles);

    const glowGeometry = new THREE.SphereGeometry(20, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.02,
        side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowSphere);

    const glowGeometry2 = new THREE.SphereGeometry(35, 32, 32);
    const glowMaterial2 = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.015,
        side: THREE.BackSide
    });
    const glowSphere2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
    scene.add(glowSphere2);

    let pagodaObject = null;

    const mtlLoader = new MTLLoader();
    mtlLoader.load('/models/shaolin-cangjingge.mtl', function(materials) {
        materials.preload();
        
        const loader = new OBJLoader();
        loader.setMaterials(materials);
        loader.load('/models/shaolin-cangjingge.obj', function(object) {
            object.scale.set(2, 2, 2);
            object.position.y = -0.5;
            
            object.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        if (child.material.name === 'plaque_gold') {
                            child.material.emissive = new THREE.Color(0xffd700);
                            child.material.emissiveIntensity = 0.4;
                        }
                        if (child.material.name === 'red_accent') {
                            child.material.emissive = new THREE.Color(0xdc143c);
                            child.material.emissiveIntensity = 0.15;
                        }
                        if (child.material.name === 'wood_main') {
                            child.material.emissive = new THREE.Color(0x3d2e1f);
                            child.material.emissiveIntensity = 0.05;
                        }
                    }
                }
            });

            pagodaObject = object;
            scene.add(object);
        }, function(xhr) {
            console.log('Loading model: ' + Math.round(xhr.loaded / xhr.total * 100) + '%');
        }, function(error) {
            console.error('Error loading model:', error);
        });
    });

    let time = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        if (pagodaObject) {
            pagodaObject.rotation.y += 0.0015;
        }

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += particleVelocities[i * 3];
            positions[i * 3 + 1] += particleVelocities[i * 3 + 1];
            positions[i * 3 + 2] += particleVelocities[i * 3 + 2];

            if (positions[i * 3 + 1] > 10) {
                positions[i * 3 + 1] = -10;
            }
            if (Math.abs(positions[i * 3]) > 20) {
                particleVelocities[i * 3] *= -1;
            }
            if (Math.abs(positions[i * 3 + 2]) > 20) {
                particleVelocities[i * 3 + 2] *= -1;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y += 0.0005;

        orbParticles.rotation.y += 0.001;
        orbParticles.rotation.x += 0.0003;

        glowSphere.rotation.y += 0.0005;
        glowSphere2.rotation.y += 0.0003;

        lanternLight1.intensity = 0.8 + Math.sin(time * 2) * 0.2;
        lanternLight2.intensity = 0.8 + Math.cos(time * 2) * 0.2;
        pointLight3.intensity = 0.25 + Math.sin(time * 1.5) * 0.1;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});