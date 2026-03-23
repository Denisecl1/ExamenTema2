import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================= VARIABLES DEL JUEGO (NIVELES) =================
let score = 0;
let nivel = 1;
let fallos = 0;
let pelotasLanzadas = 0;

const MAX_FALLOS = 3;   // Pierdes al fallar 3 veces
const MAX_PELOTAS = 10; // Avanzas de nivel cada 10 pelotas
let velocidadPelota = 12; // La velocidad inicial de la pelota
let juegoActivo = true; // Para detener todo si perdemos

// ================= ESCENA, CÁMARA Y RENDER =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 3, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

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

// ================= ESCENARIO Y MÁQUINA =================
const gltfLoader = new GLTFLoader();

gltfLoader.load('./Textura/baseball_base.glb', (gltf) => {
    const escenario = gltf.scene;
    escenario.scale.set(0.01, 0.01, 0.01);
    escenario.position.set(0, -1, 0);
    escenario.rotation.y = Math.PI;
    escenario.traverse((child) => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    scene.add(escenario);
});

gltfLoader.load('./Textura/pitching_machine.glb', (gltf) => {
    const maquina = gltf.scene;
    maquina.scale.set(1, 1, 1); 
    maquina.position.set(-11, -1, 2.5);
    maquina.rotation.y = Math.PI / 2;
    maquina.traverse((child) => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    scene.add(maquina);
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
    
    resetBall();
});

function loadAnim(name, path) {
    fbxLoader.load(path, (anim) => {
        actions[name] = mixer.clipAction(anim.animations[0]);
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

let isSwinging = false;
let swingTime = 0;

window.addEventListener('mousedown', () => {
    if (!isSwinging && juegoActivo) {
        isSwinging = true;
        swingTime = 0;
        setAction('swing');
    }
});

// ================= PELOTA Y FÍSICA =================
const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
);
ball.castShadow = true;
scene.add(ball);

let ballHit = false; 
let ballVelocity = new THREE.Vector3(0, 0, 0); 

function resetBall() {
    if (!personaje) return;
    ballHit = false;
    ballVelocity.set(0, 0, 0);
    ball.position.set(personaje.position.x - 15, 1.2, personaje.position.z);
}

// ================= LÓGICA DE NIVELES =================

function actualizarHUD() {
    document.getElementById('nivel').innerText = nivel;
    document.getElementById('score').innerText = score;
    document.getElementById('fallos').innerText = fallos;
    document.getElementById('pelotas').innerText = pelotasLanzadas;
}

function verificarEstadoJuego() {
    // Si perdemos...
    if (fallos >= MAX_FALLOS) {
        juegoActivo = false;
        alert(`¡GAME OVER! 🔴\n\nLlegaste al Nivel: ${nivel}\nTu Score: ${score}\n\nPresiona Aceptar para reiniciar.`);
        
        // Reiniciar variables a cero
        nivel = 1;
        score = 0;
        fallos = 0;
        pelotasLanzadas = 0;
        velocidadPelota = 12; // Volver a velocidad normal
        juegoActivo = true;
        
        actualizarHUD();
        resetBall();
    } 
    // Si ganamos el nivel...
    else if (pelotasLanzadas >= MAX_PELOTAS) {
        juegoActivo = false;
        nivel++;
        velocidadPelota += 4; // ¡AUMENTAMOS LA VELOCIDAD DE LA PELOTA!
        pelotasLanzadas = 0;
        fallos = 0; // Te perdonamos los fallos al pasar de nivel
        
        alert(`¡NIVEL COMPLETADO! 🏆\n\nAvanzas al Nivel ${nivel}.\n¡Prepárate, la máquina lanzará más rápido!`);
        
        juegoActivo = true;
        actualizarHUD();
        resetBall();
    } 
    // Si el juego sigue normal...
    else {
        resetBall();
    }
}

function registrarFallo() {
    if (!juegoActivo) return;
    fallos++;
    pelotasLanzadas++;
    actualizarHUD();
    verificarEstadoJuego();
}

function registrarAcierto() {
    if (!juegoActivo) return;
    pelotasLanzadas++;
    actualizarHUD();
    verificarEstadoJuego();
}

// ================= HIT =================
function checkHit() {
    if (ballHit || !juegoActivo) return;

    const dx = personaje.position.x - ball.position.x;
    const dz = personaje.position.z - ball.position.z;
    const distanciaHorizontal = Math.sqrt(dx * dx + dz * dz);

    if (distanciaHorizontal < 2.0) { 
        score++;
        actualizarHUD(); // Actualizamos solo el score al batear
        
        ballHit = true;
        ballVelocity.x = - (15 + Math.random() * 10); 
        ballVelocity.y = 8 + Math.random() * 5;      
        ballVelocity.z = (Math.random() - 0.5) * 10; 
    }
}

// ================= LÓGICA DE ACTUALIZACIÓN =================
const clock = new THREE.Clock();

function update(delta) {
    if (!personaje) return;

    let moving = false;

    // Movimiento (solo si el juego está activo)
    if (juegoActivo) {
        if (keys['a'] || keys['arrowleft']) {
            personaje.position.z += 4 * delta;
            setAction('left');
            moving = true;
        } else if (keys['d'] || keys['arrowright']) {
            personaje.position.z -= 4 * delta;
            setAction('right');
            moving = true;
        }
    }

    // Animación de Swing
    if (isSwinging) {
        swingTime += delta;
        if (swingTime > 0.15 && swingTime < 0.35) {
            checkHit();
        }
        if (swingTime > 0.6) { 
            isSwinging = false;
            setAction('idle');
        }
    } else if (!moving) {
        setAction('idle');
    }

    // ================= MOVIMIENTO DE LA PELOTA =================
    if (juegoActivo) {
        if (!ballHit) {
            // 1. SI NO HA SIDO BATEADA (Viene hacia ti)
            // AHORA USA LA VARIABLE "velocidadPelota" QUE CRECE CADA NIVEL
            ball.position.x += velocidadPelota * delta; 

            // DETECCIÓN DE GOLPE AL CUERPO
            const dx = personaje.position.x - ball.position.x;
            const dz = personaje.position.z - ball.position.z;
            const distanciaHorizontal = Math.sqrt(dx * dx + dz * dz);
            
            if (distanciaHorizontal < 0.6 && !isSwinging) {
                // Te golpeó = Fallo
                registrarFallo(); 
            }

            // Si pasa al jugador sin ser bateada = Fallo (Strike)
            if (ball.position.x > personaje.position.x + 2) {
                registrarFallo();
            }

        } else {
            // 2. SI YA FUE BATEADA (Vuela)
            ball.position.x += ballVelocity.x * delta;
            ball.position.y += ballVelocity.y * delta;
            ball.position.z += ballVelocity.z * delta;

            ballVelocity.y -= 15 * delta; // Gravedad

            // Si la pelota toca el suelo (cae en el pasto) = Acierto completado
            if (ball.position.y < -0.8) {
                registrarAcierto(); 
            }
        }
    }

    // Cámara
    camera.position.x = personaje.position.x + 5;
    camera.position.y = personaje.position.y + 4;
    camera.position.z = personaje.position.z;
    controls.target.copy(personaje.position);
}

// ================= LOOP =================
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    update(delta);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});