import './style.css';
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap'
import LocomotiveScroll from 'locomotive-scroll';
const locomotiveScroll = new LocomotiveScroll();

// Create a loading overlay
const loadingOverlay = document.createElement('div');
loadingOverlay.style.position = 'fixed';
loadingOverlay.style.top = '0';
loadingOverlay.style.left = '0';
loadingOverlay.style.width = '100%';
loadingOverlay.style.height = '100%';
loadingOverlay.style.backgroundColor = 'black';
loadingOverlay.style.zIndex = '9999';
document.body.appendChild(loadingOverlay);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

const renderer = new THREE.WebGLRenderer({
  canvas:document.querySelector("#canvas"),
  antialias:true,
  alpha:true
});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

camera.position.z = 8;

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015;
composer.addPass(rgbShiftPass);

let model;
let assetsLoaded = 0;
const totalAssets = 2; // HDRI and GLTF model

function checkAllAssetsLoaded() {
  assetsLoaded++;
  if (assetsLoaded === totalAssets) {
    // Fade out the loading overlay
    gsap.to(loadingOverlay, {
      opacity: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        loadingOverlay.style.display = 'none';
        // Apply blink effect to the image
        const image = document.querySelector('#blink');
        if (image) {
          gsap.to(image, {
            opacity: 0,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            onComplete: () => {
              gsap.to(image, {
                opacity: 1,
                duration: 0.2
              });
            }
          });
        }
      }
    });
  }
}

// Load HDRI environment map
new RGBELoader()
  .load( 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function ( texture ) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture;
    scene.environment = texture;
    checkAllAssetsLoaded();

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
        'public/DamagedHelmet.gltf',
        function ( gltf ) {
           model = gltf.scene;
           scene.add(model);
           model.position.set(0, 0, 0);
           model.scale.set(2, 2, 2);
           checkAllAssetsLoaded();
        },
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        function ( error ) {
            console.error( 'An error happened', error );
        }
    );
  } );

window.addEventListener("mousemove", (e) => {
  if (model) {
    const rotationX = (e.clientY / window.innerHeight - 0.5) * (Math.PI)*0.12; // Use clientY for X rotation
    const rotationY = (e.clientX / window.innerWidth - 0.5) * (Math.PI)*0.12; // Use clientX for Y rotation
    gsap.to(model.rotation, {
      x: rotationX,
      y: rotationY,
      duration: 0.5,
      ease: "power2.out"
    });
  }
});

window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update composer
    composer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
	composer.render();
}

renderer.setAnimationLoop( animate );

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});