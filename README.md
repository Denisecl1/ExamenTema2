# ⚾ Simulador de Bateo 3D

![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

Un simulador interactivo de bateo en 3D desarrollado para la web. Este proyecto recrea la experiencia de una jaula de bateo profesional (estilo estadio nocturno) donde el jugador debe demostrar sus reflejos y coordinación para golpear las pelotas lanzadas por una máquina automática, superando niveles de dificultad incremental.

> **Proyecto académico** desarrollado para la carrera de Ingeniería en Tecnologías de la Información y Comunicaciones (TIC).

---

## 🎮 Características Principales

* **Entorno 3D Inmersivo:** Escenario renderizado con WebGL utilizando Three.js, incluyendo césped sintético, cuadrícula tecnológica, cielo estrellado y luna emisiva.
* **Animaciones Fluidas (FBX):** Personaje 3D con animaciones completas para estado de espera (idle), movimiento lateral, bateo (swing) y celebración (baile de victoria).
* **Física y Colisiones:** Cálculo en tiempo real de trayectorias, gravedad y detección de colisiones entre el bate y la pelota.
* **Progresión de Niveles:** La dificultad aumenta en cada nivel, incrementando la velocidad de las pelotas lanzadas.
* **Interfaz de Usuario (HUD):** Panel de estado transparente que muestra el Nivel actual, Score, Fallos (Strikes) y Pelotas lanzadas.
* **Sistema de Pausa y Menús:** Interfaz web superpuesta con menú de inicio, instrucciones, pausa (con animaciones CSS avanzadas) y Game Over.
* **Efectos de Audio (SFX):** Sonidos integrados para impactos de bate, victoria de nivel y finalización del juego.



---

## 🕹️ Controles del Juego

| Acción | Control |
| :--- | :--- |
| **Moverse a la Izquierda** | Tecla `A` o `Flecha Izquierda` |
| **Moverse a la Derecha** | Tecla `D` o `Flecha Derecha` |
| **Batear (Swing)** | `Clic Izquierdo` del Ratón |
| **Pausar / Reanudar** | Tecla `P` |

**Reglas:**
1. Golpea la pelota en el momento exacto para sumar puntos.
2. Si la pelota te golpea o pasa detrás de ti sin batearla, sumas un fallo.
3. El juego termina al acumular **3 fallos**.
4. Sobrevive a **10 pelotas** para avanzar al siguiente nivel (la velocidad aumentará).

---

## 🛠️ Tecnologías y Herramientas

* **Lógica Core:** Vanilla JavaScript (ES6 Modules).
* **Renderizado 3D:** [Three.js](https://threejs.org/) (v0.160.0).
* **Carga de Modelos:** `FBXLoader` (para personajes y animaciones) y `GLTFLoader` (para el entorno, máquina y pelota).
* **Diseño UI:** HTML5 y CSS3 (Animaciones por fotogramas, gradientes, flexbox, grid).
* **Controles de Cámara:** `OrbitControls` para la perspectiva estática en tercera persona.

---

## 🚀 Instalación y Uso Local

Debido a las políticas de seguridad de los navegadores web (CORS) al cargar texturas y modelos 3D locales, este proyecto debe ejecutarse a través de un servidor local.

1. **Clona este repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/simulador-bateo-3d.git](https://github.com/tu-usuario/simulador-bateo-3d.git)

---

## Desarrollado

Autor: Diana Denise Campos Lozano 
Materia: Desarrollo de Ambientes virtuales 
Carrera: ITIC'S
