import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================= VARIABLES DEL JUEGO =================
let score = 0;
let nivel = 1;
let fallos = 0;
let pelotasLanzadas = 0;

const MAX_FALLOS = 3;
const MAX_PELOTAS = 10;
let velocidadPelota = 12;

let juegoActivo = false;
let esGameOver = false;
let isDancing = false;

// ================= ESCENA Y ENTORNO 3D =================
const scene = new THREE.Scene();

// 1. Fondo de noche/simulador (Azul muy oscuro)
const colorFondo = 0x0a192f;
scene.background = new THREE.Color(colorFondo);

// 2. Niebla para dar profundidad y ocultar el horizonte
scene.fog = new THREE.FogExp2(colorFondo, 0.015);

// 3. Piso infinito (Césped sintético oscuro)
const pisoGeo = new THREE.PlaneGeometry(300, 300);
const pisoMat = new THREE.MeshStandardMaterial({ 
    color: 0x113311, // Verde oscuro
    roughness: 0.8,
    metalness: 0.1
});
const piso = new THREE.Mesh(pisoGeo, pisoMat);
piso.rotation.x = -Math.PI / 2;
piso.position.y = -1.05; // Un poquito debajo de tu base GLB para que no parpadee
piso.receiveShadow = true;
scene.add(piso);

// 4. Cuadrícula de simulador (Le da un toque súper tecnológico)
const gridHelper = new THREE.GridHelper(300, 150, 0x4CAF50, 0x222222);
gridHelper.position.y = -1.04;
gridHelper.material.opacity = 0.25;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// ================= CÁMARA =================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 3, 6);

// ================= SONIDOS =================
const listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();

const sonidoBateo = new THREE.Audio(listener);
audioLoader.load('sonido/bateo.mp3', function(buffer) {
    sonidoBateo.setBuffer(buffer);
    sonidoBateo.setVolume(0.8);
});

const sonidoFinJuego = new THREE.Audio(listener);
audioLoader.load('sonido/fin de juego.mp3', function(buffer) {
    sonidoFinJuego.setBuffer(buffer);
    sonidoFinJuego.setVolume(1.0);
});

const sonidoGameOver = new THREE.Audio(listener);
audioLoader.load('sonido/gameover.mp3', function(buffer) {
    sonidoGameOver.setBuffer(buffer);
    sonidoGameOver.setVolume(1.0);
});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// Limpiamos cualquier CSS de imagen de fondo que haya quedado
document.body.style.backgroundImage = "none";
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 4;
controls.maxDistance = 15;

// ================= LUCES =================
scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // Luz ambiental un poco más suave
const light = new THREE.DirectionalLight(0xffffff, 1.8); // Reflector principal fuerte
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 2048; // Mejor calidad de sombra
light.shadow.mapSize.height = 2048;
scene.add(light);
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));

// ================= ESCENARIO =================
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
    loadAnim('dance', 'models/Dance.fbx');
    
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

// ================= CONTROLES Y PAUSAS =================
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

// 🔥 PAUSA DE INSTRUCCIONES
const btnInstrucciones = document.getElementById('btnInstrucciones');
const instruccionesModal = document.getElementById('instruccionesModal');
const cerrarInstrucciones = document.getElementById('cerrarInstrucciones');
let estadoAnterior = false; 

btnInstrucciones.addEventListener('click', () => {
    instruccionesModal.classList.remove('modal-oculto');
    estadoAnterior = juegoActivo;
    juegoActivo = false; 
});

cerrarInstrucciones.addEventListener('click', () => {
    instruccionesModal.classList.add('modal-oculto');
    juegoActivo = estadoAnterior; 
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

// ================= EVENTO DE INICIO =================
const pantallaInicio = document.getElementById('pantallaInicio');
const botonIniciar = document.getElementById('botonIniciar');

botonIniciar.addEventListener('click', () => {
    pantallaInicio.classList.add('oculto');
    juegoActivo = true;
    resetBall();

    if (sonidoBateo.context.state === 'suspended') sonidoBateo.context.resume();
});

// ================= LÓGICA DE NIVELES =================
const modal = document.getElementById('gameModal');
const modalTitulo = document.getElementById('modalTitulo');
const modalMensaje = document.getElementById('modalMensaje');
const modalBoton = document.getElementById('modalBoton');
const modalContenido = modal.querySelector('.modal-contenido');

modalBoton.addEventListener('click', () => {
    modal.classList.add('modal-oculto');
    isDancing = false;
    setAction('idle');
    
    if (esGameOver) {
        pantallaInicio.classList.remove('oculto');
    } else {
        juegoActivo = true;                  
        resetBall();                        
    }
    
    actualizarHUD();
});

function actualizarHUD() {
    document.getElementById('nivel').innerText = nivel;
    document.getElementById('score').innerText = score;
    document.getElementById('fallos').innerText = fallos;
    document.getElementById('pelotas').innerText = pelotasLanzadas;
}

function verificarEstadoJuego() {
    if (fallos >= MAX_FALLOS) {
        juegoActivo = false;
        esGameOver = true;
        
        if (sonidoGameOver.isPlaying) sonidoGameOver.stop();
        sonidoGameOver.play();
        
        modalContenido.classList.add('modal-game-over');
        modalTitulo.innerText = "¡GAME OVER!";
        modalMensaje.innerText = `Llegaste al Nivel: ${nivel}\nTu Score Final: ${score}`;
        modalBoton.innerText = "Reintentar";
        
        modal.classList.remove('modal-oculto');
        
        nivel = 1;
        score = 0;
        fallos = 0;
        pelotasLanzadas = 0;
        velocidadPelota = 12;
    }
    else if (pelotasLanzadas >= MAX_PELOTAS) {
        juegoActivo = false;
        esGameOver = false;
        
        isDancing = true;
        setAction('dance');
        if (sonidoFinJuego.isPlaying) sonidoFinJuego.stop();
        sonidoFinJuego.play();

        setTimeout(() => {
            nivel++;
            velocidadPelota += 4;
            pelotasLanzadas = 0;
            fallos = 0;
            
            modalContenido.classList.remove('modal-game-over');
            modalTitulo.innerText = "¡NIVEL COMPLETADO!";
            modalMensaje.innerText = `Avanzas al Nivel ${nivel}.\n¡Prepárate, la máquina lanzará más rápido!`;
            modalBoton.innerText = "Siguiente Nivel";
            
            modal.classList.remove('modal-oculto');
        }, 3500);
    }
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
        actualizarHUD();
        
        if (sonidoBateo.isPlaying) sonidoBateo.stop();
        sonidoBateo.play();

        ballHit = true;
        ballVelocity.x = - (15 + Math.random() * 10);
        ballVelocity.y = 8 + Math.random() * 5;      
        ballVelocity.z = (Math.random() - 0.5) * 10;
    }
}

// ================= UPDATE =================
const clock = new THREE.Clock();

function update(delta) {
    if (!personaje) return;

    let moving = false;

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

    if (isDancing) {
        // No hacer nada
    }
    else if (isSwinging) {
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

    if (juegoActivo) {
        if (!ballHit) {
            ball.position.x += velocidadPelota * delta;

            const dx = personaje.position.x - ball.position.x;
            const dz = personaje.position.z - ball.position.z;
            const distanciaHorizontal = Math.sqrt(dx * dx + dz * dz);
            
            if (distanciaHorizontal < 0.6 && !isSwinging) {
                registrarFallo();
            }

            if (ball.position.x > personaje.position.x + 2) {
                registrarFallo();
            }

        } else {
            ball.position.x += ballVelocity.x * delta;
            ball.position.y += ballVelocity.y * delta;
            ball.position.z += ballVelocity.z * delta;

            ballVelocity.y -= 15 * delta;

            if (ball.position.y < -0.8) {
                registrarAcierto();
            }
        }
    }

    // 🔥 MODIFICACIÓN DE CÁMARA PARA VER LA MÁQUINA
    camera.position.x = personaje.position.x + 9;
    camera.position.y = personaje.position.y + 4.5;
    camera.position.z = personaje.position.z;
    
    controls.target.set(personaje.position.x - 5, personaje.position.y + 1, personaje.position.z);
    
    controls.update();
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});