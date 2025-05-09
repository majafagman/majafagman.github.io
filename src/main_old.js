import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "gsap";

// Grunder
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

// Kamera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.01, 1000);
camera.position.set(0, 4, 15);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Ljus
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(10, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// Golv som fångar skuggor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.ShadowMaterial({ opacity: 0.2 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Miljö
const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/SkyBox/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);
scene.environment = environmentMap;
scene.background = environmentMap;

// Texturer
const textureLoader = new THREE.TextureLoader();
const textureMap = {
  First: {
    day: "/textures/Assets_text_03.webp",
  },
};
const loadedTextures = {
  day: {},
};
Object.entries(textureMap).forEach(([key, paths]) => {
  const tex = textureLoader.load(paths.day);
  tex.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.day[key] = tex;
});

// Modell och animation
const clock = new THREE.Clock();
let mixer;
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Interaktion
const clickableGroups = {};
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let hoveredObject = null;
let clickableNames = ["Monster.001", "Chair"];

// Ladda modellen
loader.load(
  "models/Scene_20.glb",
  (glb) => {
    const model = glb.scene;
    scene.add(model);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;

        Object.keys(textureMap).forEach((key) => {
          if (child.name.includes(key)) {
            child.material = new THREE.MeshStandardMaterial({
              map: loadedTextures.day[key],
              envMap: environmentMap,
              envMapIntensity: 1,
              color: 0xffffff,
              metalness: 0,
              roughness: 0.5,
              side: THREE.DoubleSide,
            });
          }
        });

        if (child.name.includes("Transparent")) {
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
          clickableGroups[child.name] = child;
        }
      }
    });

    // Animation
    if (glb.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(glb.animations[0]);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();
    }

    console.log("✅ Modell laddad");
  },
  undefined,
  (error) => {
    console.error("❌ Misslyckades att ladda modell:", error);
  }
);

// Events
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener("click", () => {
  if (hoveredObject && clickableNames.includes(hoveredObject.name)) {
    if (hoveredObject.name === "Monster.001") {
      window.location.href = "https://example.com/monster";
    } else if (hoveredObject.name === "Chair") {
      window.location.href = "https://example.com/chair";
    }
  }
});

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Render-loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let foundHover = null;
  for (let intersect of intersects) {
    let topLevel = intersect.object;
    while (topLevel.parent && topLevel.parent.type !== "Scene") {
      topLevel = topLevel.parent;
    }
    if (clickableNames.includes(topLevel.name)) {
      foundHover = topLevel;
      break;
    }
  }

  if (hoveredObject !== foundHover) {
    if (hoveredObject) hoveredObject.scale.set(1, 1, 1);
    if (foundHover) foundHover.scale.set(1.2, 1.2, 1.2);
    hoveredObject = foundHover;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

