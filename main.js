import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================= ESCENA =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 60);

// ================= CÁMARA =================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 3, 6);

// ================= RENDER =================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ================= CONTROLES DE CÁMARA =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 4;
controls.maxDistance = 10;

// ================= LUCES =================
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(10, 15, 10);
light.castShadow = true;
scene.add(light);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

// ================= ESCENARIO =================
const gltfLoader = new GLTFLoader();

gltfLoader.load('./Textura/baseball_base.glb', (gltf) => {
    const escenario = gltf.scene;

    escenario.scale.set(0.01, 0.01, 0.01);
    escenario.position.set(0, -1, 0);
    escenario.rotation.y = Math.PI;

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

    personaje.position.set(8.5, -1, 2.5);

    // mira hacia el pitcher (hacia -X)
    personaje.rotation.y = -Math.PI / 2;

    personaje.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.transparent = false;
            child.material.opacity = 1;
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
    
    // Inicia la pelota una vez que el personaje ya existe
    resetBall();
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

// ================= CONTROLES DE TECLADO =================
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// ================= SWING =================
let isSwinging = false;
let swingTime = 0;

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

// 🔥 colocar pelota ENFRENTE (pitcher)
function resetBall() {
    if (!personaje) return;

    // Aparece frente al jugador (lado pitcher, eje -X)
    ball.position.set(
        personaje.position.x - 15, // Viene desde lejos en el eje negativo
        1.2,
        personaje.position.z // Sigue al jugador lateralmente
    );
}

// ================= HIT =================
function checkHit() {
    const distance = personaje.position.distanceTo(ball.position);

    // Rango de bateo ajustado
    if (distance < 2.0) { 
        score++;
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.innerText = "Score: " + score;
        }
        resetBall();
    }
}

// ================= LÓGICA DE ACTUALIZACIÓN =================
const clock = new THREE.Clock();

function update(delta) {

    if (!personaje) return;

    let moving = false;

    // Movimiento lateral (sobre el eje Z porque está rotado)
    if (keys['a'] || keys['arrowleft']) {
        personaje.position.z += 4 * delta;
        setAction('left');
        moving = true;
    }
    else if (keys['d'] || keys['arrowright']) {
        personaje.position.z -= 4 * delta;
        setAction('right');
        moving = true;
    }

    // Lógica del Swing
    if (isSwinging) {
        swingTime += delta;

        // Ventana de tiempo donde el bate golpea la pelota
        if (swingTime > 0.15 && swingTime < 0.35) {
            checkHit();
        }

        // Termina la animación de swing
        if (swingTime > 0.6) { 
            isSwinging = false;
            setAction('idle');
        }
    }
    else if (!moving) {
        setAction('idle');
    }

    // 🔥 mover pelota HACIA el jugador (hacia +X)
    ball.position.x += 12 * delta;

    // Si la pelota pasa al jugador (su X es mayor que la del personaje)
    if (ball.position.x > personaje.position.x + 2) {
        resetBall();
    }

    // La cámara persigue al jugador
    camera.position.x = personaje.position.x + 5;
    camera.position.y = personaje.position.y + 4;
    camera.position.z = personaje.position.z;

    controls.target.copy(personaje.position);
}

// ================= LOOP DE RENDERIZADO =================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    update(delta);

    controls.update();
    renderer.render(scene, camera);
}
animate();

// ================= AJUSTE DE VENTANA (RESIZE) =================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});