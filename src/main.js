// Importer
import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";

// Canvas & Renderer
const canvas = document.querySelector("#experience-canvas");
const sizes = { width: window.innerWidth, height: window.innerHeight };
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0); // Gör bakgrunden transparent
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Funktion för att justera canvasens position och storlek
function adjustCanvas() {
  const headerHeight = document.getElementById("main-header").offsetHeight;
  const canvas = document.getElementById("experience-canvas");

  canvas.style.top = `${headerHeight}px`;
  canvas.style.height = `calc(100vh - ${headerHeight}px)`;
}

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
controls.maxPolarAngle = Math.PI / 1.7; // Maximal vinkel (t.ex. 90 grader)

// Begränsa horisontell rotation (vänster och höger)
controls.minAzimuthAngle = -Math.PI / 4; // Minsta vinkel (t.ex. -45 grader)
controls.maxAzimuthAngle = Math.PI / 4;  // Maximal vinkel (t.ex. 45 grader)

controls.maxDistance = 40; // Maximal zoom-out avstånd
controls.minDistance = 5; // Minimal zoom-in avstånd
controls.enablePan = true; // Tillåt panorering
controls.update();


// Ljus
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(10, 10, 5);
dirLight.castShadow = true;
dirLight.receiveShadow = true; 
dirLight.shadow.mapSize.set(512, 512);
dirLight.shadow.bias = -0.005;
scene.add(dirLight);

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
VideoElement.src = "/videos/Showreel_15sek.mp4";
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
    }
  });

  VideoElement.play().catch((error) => console.error("❌ Videofel:", error));
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
  "Headphones_2", "Hickap_1", "Stars_01", "Stars_02", "Stars_03", "Lynk", "Filmic", "Mail", "Behance001", "Instagram", "LinkedIn"
];
const hoverableNames = [
  "Monster", "Suitcase", "Screen", "Screen_body", "Macbook", "Chair",
  "Headphones_2", "Hickap_1", "Stars_01", "Stars_02", "Stars_03", "Lynk", "Filmic", "Mail", "Behance001", "Instagram", "LinkedIn"
];

loader.load("/models/Scene_31.glb", (glb) => {
  const model = glb.scene;
  glb.scene.scale.set(1,1,1);
  scene.add(model);
  

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({
        map: child.material.map || null,
        envMap: environmentMap,
        envMapIntensity: 1,
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        side: THREE.DoubleSide,
      });

      if (["Monster_glass", "Hickap_glass"].includes(child.name)) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 1,
          roughness: 0,
          metalness: 0,
          ior: 1.5,
          thickness: 0.01,
          envMapIntensity: 1,
        });
      }

      if (clickableNames.includes(child.name)) {
        // Spara parent-gruppen, inte bara child
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
  console.log("Klick på canvas");
  //raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let intersect of intersects) {
    const name = intersect.object.name;
    if (clickableNames.includes(name)) {
      console.log(`🖱️ Klickade på: ${name}`);
      if (["Monster", "Monster_glass"].includes(name)) {
        window.location.href = "/src/Monster.html";
        
      } else if (name === "Chair") {
        window.location.href = "/src/Chair.html";
      }
      else if (name === "Suitcase") {
        window.location.href = "/src/Mimic.html";
      }
      else if (name === "Macbook_1, Mackbook_2") {
        window.location.href = "/src/Macbook.html";
      }
      else if (name === "Screen") {
        window.location.href = "/src/Showreel.html";
      }
      else if (name === "Headphones_2") {
        window.location.href = "/src/Headphones.html";
      }
      else if (name === "Hickap_1") {
        window.location.href = "/src/Hickap.html";
      }
      else if (name === "Instagram") {
        window.location.href = "https://www.instagram.com/majafagman3d/";
      }
      else if (name === "LinkedIn") {
        window.location.href = "https://www.linkedin.com/in/maja-fagman-5b107129a/";
      }
      else if (name === "Behance001") {
        window.location.href = "https://www.behance.net/majafagman/projects#";
      }
      else if (name === "Mail") {
        window.location.href = "mailto:majafag04@gmail.com";
      }
      else if (name === "Filmic") {
        window.location.href = "https://www.instagram.com/majafagman3d/";
      }
      else if (name === "Lynk") {
        window.location.href = "https://www.instagram.com/majafagman3d/";
      }
      break;
    }
  }
});


//let hoveredObject = null; // Track the currently hovered object

canvas.addEventListener("mousemove", (event) => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let foundHover = null;

  for (let intersect of intersects) {
    const name = intersect.object.name;

    if (name === "Screen" || name === "Screen_body") {
      foundHover = intersect.object;

      // Hämta både Screen och Screen_body
      const screen = scene.getObjectByName("Screen");
      const screenBody = scene.getObjectByName("Screen_body");

      // Skala båda objekten
      gsap.to(screen.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.3,
        overwrite: true,
      });

      gsap.to(screenBody.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.3,
        overwrite: true,
      });
    } else if (hoverableNames.includes(name)) {
      // Generell skalning för andra objekt
      foundHover = intersect.object;

      gsap.to(foundHover.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.3,
        overwrite: true,
      });
    }

    if (foundHover) break;
  }

  if (hoveredObject !== foundHover) {
    // Återställ skalan för det tidigare hovrade objektet
    if (hoveredObject) {
      if (hoveredObject.name === "Screen" || hoveredObject.name === "Screen_body") {
        const screen = scene.getObjectByName("Screen");
        const screenBody = scene.getObjectByName("Screen_body");

        gsap.to(screen.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          overwrite: true,
        });

        gsap.to(screenBody.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          overwrite: true,
        });
      } else {
        // Återställ skalan för andra objekt
        gsap.to(hoveredObject.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          overwrite: true,
        });
      }
    }

    hoveredObject = foundHover; // Uppdatera det aktuella hovrade objektet
  }
});

// Fönsterstorlek
window.addEventListener("resize", () => {
  console.log("Fönsterstorlek ändrad");
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Render-loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (VideoTexture) VideoTexture.needsUpdate = true;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  /*
    let foundHover = null;
  
    for (let intersect of intersects) {
      let target = intersect.object;
      while (target && target.type !== "Scene") {
        if (clickableNames.includes(target.name) && clickableGroups[target.name]) {
          foundHover = clickableGroups[target.name];
          break;
        }
        target = target.parent;
      }
      if (foundHover) break;
    }
  
    console.log(foundHover)
  
    if (hoveredObject !== foundHover) {
      if (hoveredObject) {
        gsap.to(hoveredObject.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          overwrite: true,
        });
      }
  
      if (foundHover) {
        gsap.to(foundHover.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.3,
          overwrite: true,
        });
      }
  
      hoveredObject = foundHover;
    }*/



  controls.update();
  renderer.render(scene, camera);
}



animate();
