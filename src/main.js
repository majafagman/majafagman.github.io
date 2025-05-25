// Importer
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const pageSrc = "public/";

// Canvas & Renderer
const canvas = document.querySelector("#experience-canvas");
const sizes = { width: window.innerWidth, height: window.innerHeight };
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0); // Gör bakgrunden transparent
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;       // <= justera vid behov
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;   // mer verkliga ljusnivåer

// Funktion för att justera canvasens position och storlek
function adjustCanvas() {
  const headerHeight = document.getElementById("main-header").offsetHeight;
  const canvas = document.getElementById("experience-canvas");

  canvas.style.top = `${headerHeight}px`;
  canvas.style.height = `calc(100vh - ${headerHeight}px)`;
}

document.addEventListener("DOMContentLoaded", () => {
  const headerLogo = document.getElementById("header-logo");
  if (headerLogo) {
    headerLogo.style.opacity = "1"; // Gör logotypen synlig
    headerLogo.style.visibility = "visible"; // Se till att den inte är dold
  }
});

// Kör funktionen vid start och när fönstret ändras
window.addEventListener("resize", adjustCanvas);
adjustCanvas();

// Scen & Kamera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 5, 10);
scene.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = false; // Inaktivera autorotation om det används
controls.enablePan = false; // Inaktivera panorering om det inte behövs
controls.target.set(0, 5, -7); // Sätt kamerans mål för att fokusera på scenen

// Begränsa vertikal rotation (upp och ner)
controls.minPolarAngle = Math.PI / 4; // Minsta vinkel (t.ex. 45 grader)
controls.maxPolarAngle = Math.PI / 1.9; // Maximal vinkel (t.ex. 90 grader)

// Begränsa horisontell rotation (vänster och höger)
controls.minAzimuthAngle = -Math.PI / 4; // Minsta vinkel (t.ex. -45 grader)
controls.maxAzimuthAngle = Math.PI / 4;  // Maximal vinkel (t.ex. 45 grader)

controls.maxDistance = 30; // Maximal zoom-out avstånd
controls.minDistance = 5; // Minimal zoom-in avstånd
controls.enablePan = true; // Tillåt panorering

// Definiera gränser för panorering
const panLimits = {
  minX: -5, // Minsta X-värde
  maxX: 5,  // Maximal X-värde
  minY: 3,  // Minsta Y-värde
  maxY: 7,  // Maximal Y-värde
  minZ: -5, // Minsta Z-värde
  maxZ: 5,  // Maximal Z-värde
};

// Funktion för att begränsa panorering
function limitPan() {
  controls.target.x = Math.max(panLimits.minX, Math.min(panLimits.maxX, controls.target.x));
  controls.target.y = Math.max(panLimits.minY, Math.min(panLimits.maxY, controls.target.y));
  controls.target.z = Math.max(panLimits.minZ, Math.min(panLimits.maxZ, controls.target.z));
}
controls.update();


// Ljus


scene.add(new THREE.AmbientLight(0xffffff, 0.6));   // svagt fill-ljus

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);            // skarpare skugga
dirLight.shadow.bias = -0.001;
dirLight.shadow.camera.near  = 1;
dirLight.shadow.camera.far   = 40;
dirLight.shadow.camera.left  = -12;
dirLight.shadow.camera.right =  12;
dirLight.shadow.camera.top   =  12;
dirLight.shadow.camera.bottom= -12;
dirLight.shadow.bias = -0.005;
scene.add(dirLight);

/* ----------  BLOOM-KOMPOSITOR  ---------- */
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.2,    // strength  (0.3–0.5 brukar se naturligt ut)
  0.2,     // radius    (hur mjukt)
  0.9      // threshold (vilka pixlar som börjar glöda; 0.9=de allra ljusaste)
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

/* (valfritt) Rim-ljus bakifrån för kantljus */
const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(-4, 6, -6);
scene.add(rimLight);

// Miljöbakgrund
const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/SkyBox/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);
scene.environment = environmentMap;
scene.background = environmentMap;

// Texture laddning
const textureLoader = new THREE.TextureLoader();
const tex = textureLoader.load("/textures/Assets_text_07.webp");
tex.colorSpace = THREE.SRGBColorSpace;

// Video
const VideoElement = document.createElement("video");
VideoElement.src = "/public/videos/Showreel_15sek.mp4";
VideoElement.loop = true;
VideoElement.muted = true;
VideoElement.playsInline = true;
VideoElement.autoplay = true;

let VideoTexture = null;
VideoElement.addEventListener("canplay", () => {
  VideoTexture = new THREE.VideoTexture(VideoElement);
  VideoTexture.flipY = false;
  VideoTexture.colorSpace = THREE.SRGBColorSpace;
  VideoTexture.minFilter = THREE.LinearFilter;
  VideoTexture.magFilter = THREE.LinearFilter;
  VideoTexture.format = THREE.RGBAFormat;

  scene.traverse((child) => {
    if (child.isMesh && child.name === "Screen") {
      child.material = new THREE.MeshBasicMaterial({ map: VideoTexture, side: THREE.DoubleSide });
      console.log("✅ Material uppdaterat för Screen.");
    }
  });

  VideoElement.play().then(() => {
    console.log("✅ Videon spelas.");
  }).catch((error) => {
    console.error("❌ Videofel:", error);
  });
});

// Modell
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
loader.setDRACOLoader(dracoLoader);

const clickableGroups = {};
let mixer;
const clickableNames = [
  "Monster", "Suitcase", "Screen", "Screen_body", "Macbook", "Chair",
  "Headphones_2", "Hickap", "Hickap_glass", "Stars_01", "Stars_02", "Stars_03", "Lynk", "Filmic", "Mail", "Behance001", "Instagram", "LinkedIn", "Cube032", "Cube033"
];
const hoverableNames = [
  "Monster", "Suitcase", "Screen", "Screen_body", "Macbook", "Chair",
  "Headphones_2", "Hickap", "Hickap_glass", "Stars_01", "Stars_02", "Stars_03", "Lynk", "Filmic", "Mail", "Behance001", "Instagram", "LinkedIn"
];

loader.load("/models/Scene_34.glb", (glb) => {
  const model = glb.scene;
  glb.scene.scale.set(1, 1, 1);
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({
        map: child.material.map || null,
        envMap: environmentMap,
        envMapIntensity: 1,
        color: 0xe0e0e0,
        metalness: 0,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });

      if (["Monster_glass", "Hickap_glass"].includes(child.name)) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 1,
          roughness: 0,
          metalness: 0,
          thickness: 0.01,
          envMapIntensity: 1,
        });
      }

      if (clickableNames.includes(child.name)) {
        let top = child;
        while (top.parent && top.parent.type !== "Scene") {
          top = top.parent;
        }

        clickableGroups[child.name] = top;
        top.scale.set(1, 1, 1); // startskala

        console.log("✅ Klickbar:", top.name);
      }
    }
  });

  const overlay = document.getElementById("white-overlay");
  if (overlay) {
    overlay.style.opacity = "0"; // Gör overlay osynlig
    setTimeout(() => {
      overlay.remove(); // Ta bort overlay helt
    }, 500); // Vänta tills övergången är klar
  }
  const headerLogo = document.getElementById("header-logo");
console.log("Header logo element:", headerLogo);

if (headerLogo) {
  console.log("Visar logotypen...");
  headerLogo.style.opacity = "1";
  headerLogo.style.visibility = "visible";
}

  console.log("✅ Modellen är färdigladdad och tillagd i scenen!");


  if (glb.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(glb.animations[0]);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
  }
});

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  //console.log("Musrörelse på canvas: ", mouse.x, mouse.y);
});


canvas.addEventListener("click", () => {
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let intersect of intersects) {
    const name = intersect.object.name;
    if (clickableNames.includes(name)) {
      console.log(`🖱️ Klickade på: ${name}`);
      let modalSrc = "";

         // Hantera externa länkar
         if (name === "Instagram") {
          window.open("https://www.instagram.com/majafagman3d/?next=%2F", "_blank");
        } else if (name === "Behance001") {
          window.open("https://www.behance.net/majafagman/projects", "_blank");
        } else if (name === "LinkedIn") {
          window.open("https://www.linkedin.com/in/maja-fagman-5b107129a/", "_blank");
        } else if (name === "Mail") {
          window.location.href = "mailto:majafag04@gmail.com";
        }
  
        // Hantera modaler för andra objekt

      if (["Monster", "Monster_glass"].includes(name)) {
        modalSrc = pageSrc + "Monster.html";
      } else if (name === "Chair") {
        modalSrc = pageSrc + "Chair.html";
      } else if (name === "Suitcase") {
        modalSrc = pageSrc + "Mimic.html";
      } else if (name === "Screen") {
        modalSrc = pageSrc + "Showreel.html";
      } else if (name === "Headphones_2") {
        modalSrc = pageSrc + "Headphones.html";
      } else if (["Hickap", "Hickap_glass"].includes(name)) {
        modalSrc = pageSrc + "Hickap.html";
      } else if (["Cube032", "Cube033"].includes(name)) {
        modalSrc = pageSrc + "CV.html";
      }else if (["Filmic"].includes(name)) {
        modalSrc = pageSrc + "Filmic.html";
      }else if (["Lynk"].includes(name)) {
        modalSrc = pageSrc + "Lynk.html";
      }

      if (modalSrc) {
        openModal(modalSrc);
      }
      break;
    }
  }
});

// Funktion för att öppna modalen
function openModal(src) {
  const modal = document.getElementById("modal");
  const iframe = document.getElementById("modal-iframe");
  iframe.src = src;
  modal.classList.remove("hidden");
}

// Funktion för att stänga modalen
document.getElementById("close-modal").addEventListener("click", () => {
  const modal = document.getElementById("modal");
  const iframe = document.getElementById("modal-iframe");
  iframe.src = ""; // Rensa iframe-källan
  modal.classList.add("hidden");
});

function scaleGroup(groupNames, operation) {
  groupNames.forEach((name) => {
    const object = scene.getObjectByName(name);
    if (object) {
      scaleObject(object, operation);
    } else {
      console.warn(`❌ Objekt med namnet "${name}" hittades inte i scenen.`);
    }
  });
}
//let hoveredObject = null; // Track the currently hovered object

canvas.addEventListener("mousemove", (event) => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let foundHover = null;

  for (let intersect of intersects) {
    const name = intersect.object.name;

    if (name === "Screen" || name === "Screen_body") {
      foundHover = intersect.object;
      scaleGroup(["Screen", "Screen_body"], "zoom");
    } else if (name === "Hickap" || name === "Hickap_glass") {
      foundHover = intersect.object;
      scaleGroup(["Hickap", "Hickap_glass"], "zoom");
    } else if (name === "Monster" || name === "Monster_glass") {
      foundHover = intersect.object;
      scaleGroup(["Monster", "Monster_glass"], "zoom");
    } else if (hoverableNames.includes(name)) {
      foundHover = intersect.object;
      scaleObject(foundHover, "zoom");
    }

    if (foundHover) break;
  }

  if (hoveredObject !== foundHover) {
    if (hoveredObject) {
      if (hoveredObject.name === "Screen" || hoveredObject.name === "Screen_body") {
        scaleGroup(["Screen", "Screen_body"], "reset");
      } else if (hoveredObject.name === "Hickap" || hoveredObject.name === "Hickap_glass") {
        scaleGroup(["Hickap", "Hickap_glass"], "reset");
      } else if (hoveredObject.name === "Monster" || hoveredObject.name === "Monster_glass") {
        scaleGroup(["Monster", "Monster_glass"], "reset");
      } else {
        scaleObject(hoveredObject, "reset");
      }
    }

    hoveredObject = foundHover;
  }
});


function scaleObject(object, operation) {
  if (object) {
    if (operation === "reset") {
      var scaleX = 1;
      var scaleY = 1;
      var scaleZ = 1;
    } else {
      var scaleX = 1.2;
      var scaleY = 1.2;
      var scaleZ = 1.2;
    }

    gsap.to(object.scale, {
      x: scaleX,
      y: scaleY,
      z: scaleZ,
      duration: 0.3,
      overwrite: true,
    });
  }
}

// Fönsterstorlek
window.addEventListener("resize", () => {
  console.log("Fönsterstorlek ändrad");
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
});

// Render-loop
const clock = new THREE.Clock();


function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  
  


   // Uppdatera videoteksturen
   if (VideoTexture) VideoTexture.needsUpdate = true;

   // Begränsa panorering
   limitPan();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  controls.update();
  composer.render();
}



animate();
