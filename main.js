import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ================= ESCENA =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 60);

// ================= CÁMARA =================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8);
camera.lookAt(0, 1, 0);

// ================= RENDER =================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ================= LUCES =================
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(10, 15, 10);
light.castShadow = true;
scene.add(light);

// ================= ESCENARIO (GLB) =================
const gltfLoader = new GLTFLoader();

gltfLoader.load('Textura/baseball_base.glb', (gltf) => {
    const escenario = gltf.scene;

    escenario.scale.set(1, 1, 1);
    escenario.position.set(0, 0, 0);

    escenario.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(escenario);
});

// ================= PERSONAJE =================
let personaje, mixer;
let actions = {};
let activeAction;

const fbxLoader = new FBXLoader();

fbxLoader.load('models/Idle.fbx', (object) => {
    personaje = object;

    personaje.scale.setScalar(0.02);
    personaje.position.set(0, 0, 0);

    personaje.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.depthWrite = true;
        }
    });

    scene.add(personaje);

    mixer = new THREE.AnimationMixer(personaje);

    actions.idle = mixer.clipAction(personaje.animations[0]);
    activeAction = actions.idle;
    activeAction.play();

    loadAnim('left', 'models/Walk Left.fbx');
    loadAnim('right', 'models/Walk Right.fbx');
    loadAnim('swing', 'models/Baseball Swing.fbx');
    loadAnim('dance', 'models/Dance.fbx');
});

// ================= ANIMACIONES =================
function loadAnim(name, path) {
    fbxLoader.load(path, (anim) => {
        const action = mixer.clipAction(anim.animations[0]);
        actions[name] = action;
    });
}

function setAction(name) {
    if (!actions[name] || activeAction === actions[name]) return;

    activeAction.fadeOut(0.2);
    activeAction = actions[name];
    activeAction.reset().fadeIn(0.2).play();
}

// ================= CONTROLES =================
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// ================= SWING =================
let isSwinging = false;
let swingTime = 0;
const swingDuration = 0.5;

window.addEventListener('mousedown', () => {
    if (!isSwinging) {
        isSwinging = true;
        swingTime = 0;
        setAction('swing');
    }
});

// ================= PELOTA =================
const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
);
ball.castShadow = true;
scene.add(ball);

let score = 0;

function resetBall() {
    ball.position.set(Math.random() * 4 - 2, 1, -15);
}
resetBall();

// ================= HIT =================
function checkHit() {
    const distance = personaje.position.distanceTo(ball.position);

    if (distance < 1.5 && ball.position.z > -1 && ball.position.z < 2) {
        score++;
        document.getElementById('score').innerText = "Score: " + score;

        ball.position.z = -20;
        ball.position.y = 2;
    }
}

// ================= LÓGICA =================
const clock = new THREE.Clock();

function update(delta) {
    if (!personaje) return;

    let moving = false;

    if (keys['a'] || keys['arrowleft']) {
        personaje.position.x -= 5 * delta;
        setAction('left');
        moving = true;
    }
    else if (keys['d'] || keys['arrowright']) {
        personaje.position.x += 5 * delta;
        setAction('right');
        moving = true;
    }

    if (isSwinging) {
        swingTime += delta;

        if (swingTime > 0.2 && swingTime < 0.3) {
            checkHit();
        }

        if (swingTime >= swingDuration) {
            isSwinging = false;
            setAction('idle');
        }
    }
    else if (!moving) {
        setAction('idle');
    }

    // movimiento pelota
    ball.position.z += 10 * delta;

    if (ball.position.z > 6) {
        resetBall();
    }
}

// ================= LOOP =================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    update(delta);

    renderer.render(scene, camera);
}
animate();

// ================= RESIZE =================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});