import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AvatarEmotion, AvatarGesture } from '../types';
import {
  Sparkles,
  User,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface Avatar3DProps {
  emotion: AvatarEmotion;
  gesture: AvatarGesture;
  isSpeaking: boolean;
  audioVolume: number;
  theme: 'street_night' | 'cyber_gold' | 'neon_studio' | 'cozy_room';
  customAvatarImage?: string;
  onCheekSquish?: () => void;
  onPoseChange?: (pose: AvatarGesture) => void;
  onUploadImage?: (dataUrl: string) => void;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  emotion,
  gesture,
  isSpeaking,
  audioVolume,
  theme,
  customAvatarImage,
  onCheekSquish,
  onPoseChange,
  onUploadImage,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'photo_original' | '3d_model'>('photo_original');
  const [cameraPreset, setCameraPreset] = useState<'torso' | 'face' | 'full'>('torso');
  const [isSquishing, setIsSquishing] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(() => {
    return customAvatarImage || localStorage.getItem('sibebeb_avatar_img');
  });

  // Zoom States (Controlled bounds: not too close, safe breathing room)
  const [photoZoom, setPhotoZoom] = useState<number>(1.0); // 0.75 to 1.5
  const [threeZoomDist, setThreeZoomDist] = useState<number>(2.6); // 1.95 to 4.0

  // References for Three.js
  const animRefs = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    characterGroup?: THREE.Group;
    headGroup?: THREE.Group;
    mouthMesh?: THREE.Mesh;
    leftEyelidUpper?: THREE.Mesh;
    rightEyelidUpper?: THREE.Mesh;
    leftCheek?: THREE.Mesh;
    rightCheek?: THREE.Mesh;
    leftArmGroup?: THREE.Group;
    goldChain?: THREE.Group;
    targetHeadRot: { x: number; y: number; z: number };
    currentHeadRot: { x: number; y: number; z: number };
    mousePos: { x: number; y: number };
    blinkProgress: number;
    nextBlinkTime: number;
    squishProgress: number;
    clock: THREE.Clock;
  }>({
    targetHeadRot: { x: 0, y: 0, z: 0 },
    currentHeadRot: { x: 0, y: 0, z: 0 },
    mousePos: { x: 0, y: 0 },
    blinkProgress: 0,
    nextBlinkTime: 2.0,
    squishProgress: 0,
    clock: new THREE.Clock(),
  });

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLocalPhotoUrl(dataUrl);
        localStorage.setItem('sibebeb_avatar_img', dataUrl);
        onUploadImage?.(dataUrl);
        setActiveTab('photo_original');
        setPhotoZoom(1.0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    container.innerHTML = '';

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 350);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e18);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.95, 2.6);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    keyLight.position.set(2, 4, 3.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x80c2ff, 1.4);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffb020, 2.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Reflective Circular Stage
    const stageGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.1, 32);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x141a29, roughness: 0.3, metalness: 0.4 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = -0.55;
    stageMesh.receiveShadow = true;
    scene.add(stageMesh);

    const ringGeo = new THREE.TorusGeometry(1.65, 0.03, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.5;
    scene.add(ringMesh);

    // Textures
    const createBrotherLandTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#16171b';
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 500; i++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 4, Math.random() * 3);
      }

      ctx.font = '900 70px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillText('BROTHER', 256, 230);

      ctx.font = '900 82px Impact, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('LAND', 256, 315);

      return new THREE.CanvasTexture(c);
    };

    const createNYLogoTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#141418';
      ctx.fillRect(0, 0, 256, 256);

      ctx.font = 'bold 130px "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('NY', 128, 128);

      return new THREE.CanvasTexture(c);
    };

    const createEyeIrisTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 256);

      const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
      grad.addColorStop(0, '#1a0f0a');
      grad.addColorStop(0.5, '#421f0e');
      grad.addColorStop(0.85, '#6a3416');
      grad.addColorStop(1, '#180b06');

      ctx.beginPath();
      ctx.arc(128, 128, 115, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(128, 128, 48, 0, Math.PI * 2);
      ctx.fillStyle = '#060403';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(95, 95, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(155, 155, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      return new THREE.CanvasTexture(c);
    };

    // Character Model
    const characterGroup = new THREE.Group();
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffdfd0, roughness: 0.32, metalness: 0.02 });
    const blushMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b85, roughness: 0.4, transparent: true, opacity: 0.65 });

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.25, 0);

    const headGeo = new THREE.SphereGeometry(0.52, 32, 32);
    headGeo.scale(1, 0.98, 0.98);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Chubby Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.24, 24, 24);
    cheekGeo.scale(1.2, 0.95, 0.7);

    const leftCheek = new THREE.Mesh(cheekGeo, skinMaterial);
    leftCheek.position.set(-0.31, -0.1, 0.28);
    headGroup.add(leftCheek);

    const leftBlush = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), blushMaterial);
    leftBlush.scale.set(1.2, 0.7, 0.3);
    leftBlush.position.set(-0.32, -0.09, 0.38);
    headGroup.add(leftBlush);

    const rightCheek = new THREE.Mesh(cheekGeo, skinMaterial);
    rightCheek.position.set(0.31, -0.1, 0.28);
    headGroup.add(rightCheek);

    const rightBlush = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), blushMaterial);
    rightBlush.scale.set(1.2, 0.7, 0.3);
    rightBlush.position.set(0.32, -0.09, 0.38);
    headGroup.add(rightBlush);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.045, 16, 16);
    noseGeo.scale(1, 0.8, 1);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.03, 0.51);
    headGroup.add(noseMesh);

    // Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.05 });
    const irisTex = createEyeIrisTexture();
    const irisMat = new THREE.MeshStandardMaterial({ map: irisTex, roughness: 0.1, metalness: 0.1 });
    const eyeGeo = new THREE.SphereGeometry(0.11, 24, 24);
    eyeGeo.scale(1.05, 1.1, 0.55);

    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEyeMesh.position.set(-0.19, 0.07, 0.44);
    headGroup.add(leftEyeMesh);

    const pupilGeo = new THREE.CircleGeometry(0.09, 24);
    const leftPupil = new THREE.Mesh(pupilGeo, irisMat);
    leftPupil.position.set(-0.19, 0.07, 0.495);
    headGroup.add(leftPupil);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEyeMesh.position.set(0.19, 0.07, 0.44);
    headGroup.add(rightEyeMesh);

    const rightPupil = new THREE.Mesh(pupilGeo, irisMat);
    rightPupil.position.set(0.19, 0.07, 0.495);
    headGroup.add(rightPupil);

    // Eyelids
    const eyelidGeo = new THREE.SphereGeometry(0.125, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeo.scale(1.1, 0.95, 0.6);
    const leftEyelidUpper = new THREE.Mesh(eyelidGeo, skinMaterial);
    leftEyelidUpper.position.set(-0.19, 0.15, 0.45);
    leftEyelidUpper.rotation.x = -Math.PI / 2;
    headGroup.add(leftEyelidUpper);

    const rightEyelidUpper = new THREE.Mesh(eyelidGeo, skinMaterial);
    rightEyelidUpper.position.set(0.19, 0.15, 0.45);
    rightEyelidUpper.rotation.x = -Math.PI / 2;
    headGroup.add(rightEyelidUpper);

    // Eyebrows
    const browMat = new THREE.MeshBasicMaterial({ color: 0x241812 });
    const browGeo = new THREE.BoxGeometry(0.13, 0.025, 0.02);
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.19, 0.22, 0.47);
    leftBrow.rotation.z = 0.06;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.19, 0.22, 0.47);
    rightBrow.rotation.z = -0.06;
    headGroup.add(rightBrow);

    // Mouth
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.21, 0.46);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x9e2a3b, roughness: 0.3 });
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xf47285, roughness: 0.4 });
    const mouthGeo = new THREE.SphereGeometry(0.08, 16, 16);
    mouthGeo.scale(1.2, 0.6, 0.4);
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthGroup.add(mouthMesh);

    const upperLipGeo = new THREE.BoxGeometry(0.12, 0.025, 0.04);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.position.set(0, 0.03, 0.02);
    mouthGroup.add(upperLip);
    headGroup.add(mouthGroup);

    // Hair
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x141215, roughness: 0.6, metalness: 0.1 });
    const hairBangsGeo = new THREE.SphereGeometry(0.53, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const hairBangs = new THREE.Mesh(hairBangsGeo, hairMat);
    hairBangs.position.set(0, 0.05, 0);
    headGroup.add(hairBangs);

    const sideHairGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.45, 16);
    const leftSideHair = new THREE.Mesh(sideHairGeo, hairMat);
    leftSideHair.position.set(-0.48, -0.05, 0.05);
    leftSideHair.rotation.z = 0.2;
    headGroup.add(leftSideHair);

    const rightSideHair = new THREE.Mesh(sideHairGeo, hairMat);
    rightSideHair.position.set(0.48, -0.05, 0.05);
    rightSideHair.rotation.z = -0.2;
    headGroup.add(rightSideHair);

    // Snapback Cap
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 0.22, 0);
    capGroup.rotation.z = 0.12;
    capGroup.rotation.x = -0.1;

    const capMat = new THREE.MeshStandardMaterial({ color: 0x161619, roughness: 0.7, metalness: 0.05 });
    const crownGeo = new THREE.SphereGeometry(0.54, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52);
    crownGeo.scale(1.02, 0.9, 1.05);
    const crownMesh = new THREE.Mesh(crownGeo, capMat);
    crownMesh.castShadow = true;
    capGroup.add(crownMesh);

    const buttonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const capButton = new THREE.Mesh(buttonGeo, capMat);
    capButton.position.set(0, 0.5, 0);
    capGroup.add(capButton);

    const brimGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.025, 32, 1, false, 0, Math.PI);
    brimGeo.scale(1, 1, 0.85);
    const brimMesh = new THREE.Mesh(brimGeo, capMat);
    brimMesh.position.set(0, 0.03, 0.28);
    brimMesh.rotation.x = 0.18;
    brimMesh.rotation.y = Math.PI;
    brimMesh.castShadow = true;
    capGroup.add(brimMesh);

    const nyTex = createNYLogoTexture();
    const nyMat = new THREE.MeshBasicMaterial({ map: nyTex, transparent: true, opacity: 0.95 });
    const nyPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), nyMat);
    nyPlate.position.set(0, 0.25, 0.54);
    nyPlate.rotation.x = -0.22;
    capGroup.add(nyPlate);

    headGroup.add(capGroup);
    characterGroup.add(headGroup);

    // Gold Chain
    const goldChainGroup = new THREE.Group();
    goldChainGroup.position.set(0, 0.78, 0.16);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcb3b, metalness: 0.98, roughness: 0.16 });
    for (let i = 0; i < 20; i++) {
      const angle = (i / 19) * Math.PI;
      const x = Math.cos(angle) * 0.29;
      const y = -Math.sin(angle) * 0.22;
      const z = Math.sin(angle) * 0.12;
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.016, 10, 16), goldMat);
      link.position.set(x, y, z);
      link.rotation.x = Math.PI / 4;
      link.rotation.y = angle;
      goldChainGroup.add(link);
    }
    characterGroup.add(goldChainGroup);

    // Hoodie Body
    const hoodieTex = createBrotherLandTexture();
    const hoodieMat = new THREE.MeshStandardMaterial({ map: hoodieTex, color: 0x18181c, roughness: 0.85, metalness: 0.02 });
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 0.55, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.72, 24);
    torsoGeo.scale(1.05, 1, 0.82);
    const torsoMesh = new THREE.Mesh(torsoGeo, hoodieMat);
    torsoMesh.castShadow = true;
    bodyGroup.add(torsoMesh);

    // Arms
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.46, 0.22, 0);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.85 });
    const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.46, 16), sleeveMat);
    leftSleeve.position.set(-0.08, -0.15, 0.08);
    leftSleeve.rotation.z = -0.45;
    leftSleeve.rotation.x = -0.3;
    leftArmGroup.add(leftSleeve);

    const handGroup = new THREE.Group();
    handGroup.position.set(-0.16, -0.05, 0.28);
    const leftPalm = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), skinMaterial);
    handGroup.add(leftPalm);

    const fingerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.12, 12);
    const indexFinger = new THREE.Mesh(fingerGeo, skinMaterial);
    indexFinger.position.set(-0.03, 0.1, 0.02);
    indexFinger.rotation.z = 0.2;
    handGroup.add(indexFinger);

    const middleFinger = new THREE.Mesh(fingerGeo, skinMaterial);
    middleFinger.position.set(0.03, 0.1, 0.02);
    middleFinger.rotation.z = -0.2;
    handGroup.add(middleFinger);

    leftArmGroup.add(handGroup);
    bodyGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.46, 0.22, 0);
    const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.46, 16), sleeveMat);
    rightSleeve.position.set(0.08, -0.15, 0.02);
    rightSleeve.rotation.z = 0.35;
    rightArmGroup.add(rightSleeve);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), skinMaterial);
    rightHand.position.set(0.14, -0.32, 0.05);
    rightArmGroup.add(rightHand);
    bodyGroup.add(rightArmGroup);

    characterGroup.add(bodyGroup);

    // Legs & Sneakers
    const lowerBody = new THREE.Group();
    lowerBody.position.set(0, 0.15, 0);
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1f2024, roughness: 0.9, metalness: 0.05 });
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.42, 16), jeansMat);
    leftLeg.position.set(-0.21, -0.15, 0);
    lowerBody.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.42, 16), jeansMat);
    rightLeg.position.set(0.21, -0.15, 0);
    lowerBody.add(rightLeg);

    const sneakerSoleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const sneakerUpperMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.5 });
    const createSneaker = () => {
      const g = new THREE.Group();
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.36), sneakerSoleMat);
      sole.position.set(0, -0.04, 0.04);
      g.add(sole);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.18, 0.32), sneakerUpperMat);
      upper.position.set(0, 0.08, 0.02);
      g.add(upper);
      const toeBox = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 0.12), sneakerSoleMat);
      toeBox.position.set(0, 0.04, 0.13);
      g.add(toeBox);
      return g;
    };
    const leftSneaker = createSneaker();
    leftSneaker.position.set(-0.21, -0.45, 0);
    lowerBody.add(leftSneaker);
    const rightSneaker = createSneaker();
    rightSneaker.position.set(0.21, -0.45, 0);
    lowerBody.add(rightSneaker);

    characterGroup.add(lowerBody);
    scene.add(characterGroup);

    animRefs.current = {
      ...animRefs.current,
      scene,
      camera,
      renderer,
      characterGroup,
      headGroup,
      mouthMesh,
      leftEyelidUpper,
      rightEyelidUpper,
      leftCheek,
      rightCheek,
      leftArmGroup,
      goldChain: goldChainGroup,
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      animRefs.current.mousePos = { x, y };
      animRefs.current.targetHeadRot.y = x * 0.45;
      animRefs.current.targetHeadRot.x = -y * 0.3;
    };
    window.addEventListener('mousemove', handlePointerMove);

    // Mouse Wheel Zoom on 3D Container (with safe clamp: min 1.95, max 4.0)
    const handleWheelZoom = (e: WheelEvent) => {
      e.preventDefault();
      const cam = animRefs.current.camera;
      if (!cam) return;

      const delta = e.deltaY * 0.002;
      const targetZ = Math.min(4.0, Math.max(1.95, cam.position.z + delta));
      cam.position.z = targetZ;
      setThreeZoomDist(targetZ);
    };
    container.addEventListener('wheel', handleWheelZoom, { passive: false });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 350;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const refs = animRefs.current;
      const delta = refs.clock.getDelta();
      const time = refs.clock.getElapsedTime();

      if (refs.headGroup) {
        refs.currentHeadRot.x += (refs.targetHeadRot.x - refs.currentHeadRot.x) * 0.08;
        refs.currentHeadRot.y += (refs.targetHeadRot.y - refs.currentHeadRot.y) * 0.08;
        refs.headGroup.rotation.x = refs.currentHeadRot.x + Math.sin(time * 1.8) * 0.02;
        refs.headGroup.rotation.y = refs.currentHeadRot.y;
        refs.headGroup.rotation.z = Math.sin(time * 0.9) * 0.015;
      }

      if (refs.characterGroup) {
        refs.characterGroup.position.y = Math.sin(time * 2.2) * 0.018;
      }

      if (refs.goldChain) {
        refs.goldChain.rotation.z = Math.sin(time * 2.5) * 0.03;
      }

      if (time > refs.nextBlinkTime) {
        refs.blinkProgress += delta * 12;
        if (refs.blinkProgress > Math.PI) {
          refs.blinkProgress = 0;
          refs.nextBlinkTime = time + 2.5 + Math.random() * 3.5;
        }
      }
      const blinkScaleY = refs.blinkProgress > 0 ? Math.cos(refs.blinkProgress) : 1;
      if (refs.leftEyelidUpper && refs.rightEyelidUpper) {
        const lidRot = blinkScaleY < 0.2 ? 0 : -Math.PI / 2;
        refs.leftEyelidUpper.rotation.x = lidRot;
        refs.rightEyelidUpper.rotation.x = lidRot;
      }

      if (refs.rightCheek) {
        if (refs.squishProgress > 0) {
          refs.squishProgress -= delta * 1.5;
          const squish = Math.sin(refs.squishProgress * Math.PI);
          refs.rightCheek.scale.set(1.2 + squish * 0.45, 0.95 - squish * 0.3, 0.7 + squish * 0.3);
          if (refs.rightEyelidUpper) refs.rightEyelidUpper.rotation.x = -Math.PI / 4;
        } else {
          refs.rightCheek.scale.set(1.2, 0.95, 0.7);
        }
      }

      if (refs.mouthMesh) {
        if (isSpeaking) {
          const speechPulse = Math.abs(Math.sin(time * 14)) * 0.5 + audioVolume * 1.5;
          const openAmount = THREE.MathUtils.clamp(speechPulse, 0.2, 1.4);
          refs.mouthMesh.scale.set(1.2, 0.6 * openAmount, 0.4);
        } else {
          refs.mouthMesh.scale.set(1.2, 0.45, 0.4);
        }
      }

      if (refs.leftArmGroup) {
        if (gesture === 'peace_sign' || emotion === 'cool_peace') {
          refs.leftArmGroup.position.y = 0.22 + Math.sin(time * 3) * 0.015;
          refs.leftArmGroup.rotation.z = 0.15 + Math.sin(time * 2) * 0.03;
        } else {
          refs.leftArmGroup.rotation.z = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('wheel', handleWheelZoom);
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Safe preset camera positions
  const switchCameraView = (view: 'torso' | 'face' | 'full') => {
    setCameraPreset(view);
    const camera = animRefs.current.camera;
    if (!camera) return;

    if (view === 'face') {
      camera.position.set(0, 1.2, 2.0);
      camera.lookAt(0, 1.15, 0);
      setThreeZoomDist(2.0);
    } else if (view === 'torso') {
      camera.position.set(0, 0.95, 2.6);
      camera.lookAt(0, 0.85, 0);
      setThreeZoomDist(2.6);
    } else {
      camera.position.set(0, 0.75, 3.6);
      camera.lookAt(0, 0.65, 0);
      setThreeZoomDist(3.6);
    }
  };

  const zoomIn3D = () => {
    const cam = animRefs.current.camera;
    if (!cam) return;
    const targetZ = Math.max(1.95, cam.position.z - 0.35);
    cam.position.z = targetZ;
    setThreeZoomDist(targetZ);
  };

  const zoomOut3D = () => {
    const cam = animRefs.current.camera;
    if (!cam) return;
    const targetZ = Math.min(4.0, cam.position.z + 0.35);
    cam.position.z = targetZ;
    setThreeZoomDist(targetZ);
  };

  const resetZoom3D = () => {
    switchCameraView('torso');
  };

  const zoomInPhoto = () => {
    setPhotoZoom((prev) => Math.min(1.5, prev + 0.15));
  };

  const zoomOutPhoto = () => {
    setPhotoZoom((prev) => Math.max(0.75, prev - 0.15));
  };

  const resetZoomPhoto = () => {
    setPhotoZoom(1.0);
  };

  const triggerCheekSquish = () => {
    animRefs.current.squishProgress = 1.0;
    setIsSquishing(true);
    setTimeout(() => setIsSquishing(false), 900);
    onCheekSquish?.();
  };

  const currentZoomPercent =
    activeTab === 'photo_original'
      ? Math.round(photoZoom * 100)
      : Math.round(((4.0 - threeZoomDist) / (4.0 - 1.95)) * 100 + 50);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col rounded-2xl overflow-hidden border border-amber-500/30 bg-[#0a0e1a] shadow-2xl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOP HEADER: Clean status dot only - ZERO BUTTONS AT THE TOP to prevent collision! */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-[11px] font-bold text-amber-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>SIBEBEB • Live</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            {activeTab === 'photo_original' ? 'Foto Asli' : '3D Live'}
          </span>
        </div>

        {isSpeaking && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-[11px] font-medium text-amber-200 animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span>Bicara...</span>
          </div>
        )}
      </div>

      {/* CENTER VIEWPORT: Full Unobstructed Character Stage */}
      <div className="relative flex-1 w-full min-h-[300px] overflow-hidden flex items-center justify-center">
        {/* VIEW 1: Authentic Photo View */}
        {activeTab === 'photo_original' && (
          <div
            className="absolute inset-0 flex items-center justify-center p-3 bg-gradient-to-b from-[#0b0f1a] via-[#080c16] to-[#05070f] overflow-hidden"
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY * -0.001;
              setPhotoZoom((prev) => Math.min(1.5, Math.max(0.75, prev + delta)));
            }}
          >
            {localPhotoUrl ? (
              <div
                className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-200 ease-out"
                style={{ transform: `scale(${photoZoom})` }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40">
                  <img
                    src={localPhotoUrl}
                    alt="SIBEBEB Karakter Asli"
                    className="max-h-[340px] sm:max-h-[380px] w-auto object-contain rounded-2xl select-none"
                    draggable={false}
                  />

                  {/* Talking Overlay */}
                  {isSpeaking && (
                    <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                      <div className="px-3 py-1.5 rounded-full bg-black/75 border border-amber-400 text-amber-300 font-bold text-xs flex items-center gap-2 animate-bounce">
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>SIBEBEB Bicara...</span>
                      </div>
                    </div>
                  )}

                  {/* Squish Emoji */}
                  {isSquishing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20 backdrop-blur-[1px] pointer-events-none animate-in fade-in zoom-in duration-200">
                      <div className="px-4 py-2 rounded-2xl bg-black/85 border border-rose-400 text-rose-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xl">
                        <span className="text-lg">🤏</span>
                        <span>Aduhh Gemoyy Pipiku! 🥰</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Vector Illustration of SIBEBEB */
              <div
                className="flex flex-col items-center justify-center p-2 text-center max-w-sm transition-transform duration-200 ease-out"
                style={{ transform: `scale(${photoZoom})` }}
              >
                <div className="relative w-36 h-36 mb-2 rounded-3xl bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-400/40 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r="90" fill="#13192b" />
                    <path d="M 50 170 C 50 135, 70 120, 100 120 C 130 120, 150 135, 150 170 Z" fill="#15161a" />
                    <text x="100" y="148" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="sans-serif">BROTHER</text>
                    <text x="100" y="160" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="900" fontFamily="sans-serif">LAND</text>
                    <path d="M 78 122 Q 100 138 122 122" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="3 1.5" />
                    <ellipse cx="100" cy="90" rx="38" ry="34" fill="#ffdfd0" />
                    <ellipse cx="76" cy="98" rx="8" ry="6" fill="#ff6b85" opacity="0.6" />
                    <ellipse cx="124" cy="98" rx="8" ry="6" fill="#ff6b85" opacity="0.6" />
                    <ellipse cx="84" cy="85" rx="7" ry="8" fill="#321609" />
                    <circle cx="82" cy="83" r="2.5" fill="#ffffff" />
                    <ellipse cx="116" cy="85" rx="7" ry="8" fill="#321609" />
                    <circle cx="114" cy="83" r="2.5" fill="#ffffff" />
                    <path d="M 94 99 Q 100 104 106 99" fill="none" stroke="#ba3a4f" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 64 78 Q 100 55 136 78 C 142 95, 138 115, 138 115 C 130 100, 126 95, 126 95 C 100 90, 74 95, 74 95 C 74 95, 70 100, 62 115 C 62 115, 58 95, 64 78 Z" fill="#141416" />
                    <g transform="rotate(8 100 60)">
                      <path d="M 62 68 C 62 42, 138 42, 138 68 Z" fill="#16171b" />
                      <ellipse cx="100" cy="68" rx="42" ry="7" fill="#111215" />
                      <text x="100" y="58" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="serif">NY</text>
                    </g>
                    <g transform="translate(132, 118)">
                      <circle cx="12" cy="18" r="8" fill="#ffdfd0" />
                      <rect x="8" y="2" width="4" height="15" rx="2" fill="#ffdfd0" transform="rotate(-10 8 2)" />
                      <rect x="14" y="4" width="4" height="15" rx="2" fill="#ffdfd0" transform="rotate(15 14 4)" />
                    </g>
                  </svg>
                </div>
                <h3 className="text-sm font-black text-white mb-0.5">Karakter SIBEBEB Asli</h3>
                <p className="text-[11px] text-slate-400 mb-2">
                  Topi snapback NY miring, hoodie BROTHER LAND & pipi gemoy!
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs shadow-lg active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pasang File Foto Anda</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Three.js 3D Model View */}
        <div
          ref={mountRef}
          className={`w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-300 ${
            activeTab === '3d_model' ? 'opacity-100 relative z-10' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
        />
      </div>

      {/* DOCKED BOTTOM CONTROL CONSOLE: All Buttons Neatly Placed at the Bottom with ZERO Overlap! */}
      <div className="shrink-0 p-2.5 sm:p-3 bg-[#080c14]/95 border-t border-slate-800/80 backdrop-blur-xl z-30 space-y-2">
        {/* ROW 1: View Modes & Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Mode Tabs (Foto vs 3D) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-slate-800">
            <button
              onClick={() => setActiveTab('photo_original')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'photo_original'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Foto Karakter</span>
            </button>

            <button
              onClick={() => setActiveTab('3d_model')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === '3d_model'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>3D Model</span>
            </button>
          </div>

          {/* Zoom Controller Pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/60 border border-slate-800 text-xs">
            <button
              onClick={activeTab === '3d_model' ? zoomOut3D : zoomOutPhoto}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom Out (Jauh)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] font-extrabold text-amber-300 px-1.5 select-none min-w-[42px] text-center">
              {currentZoomPercent}%
            </span>

            <button
              onClick={activeTab === '3d_model' ? zoomIn3D : zoomInPhoto}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom In (Dekat, tidak terlalu dekat)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

            <button
              onClick={activeTab === '3d_model' ? resetZoom3D : resetZoomPhoto}
              className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Preset Angles (Only when 3D mode is active) */}
          {activeTab === '3d_model' && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-slate-800 text-xs">
              <button
                onClick={() => switchCameraView('face')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                  cameraPreset === 'face'
                    ? 'bg-amber-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Wajah & Topi (Jarak Nyaman)"
              >
                Wajah
              </button>
              <button
                onClick={() => switchCameraView('torso')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                  cameraPreset === 'torso'
                    ? 'bg-amber-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Baju & Rantai (Normal)"
              >
                Baju
              </button>
              <button
                onClick={() => switchCameraView('full')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                  cameraPreset === 'full'
                    ? 'bg-amber-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Full Body Jauh"
              >
                Jauh
              </button>
            </div>
          )}
        </div>

        {/* ROW 2: Interactive Actions (Upload, Pipi Gemoy, Pose 2 Jari) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            {/* Upload Foto Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{localPhotoUrl ? 'Ganti Foto' : 'Upload Foto'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Squish Cheek Gemoy Button */}
            <button
              onClick={triggerCheekSquish}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                isSquishing
                  ? 'bg-rose-500 text-white border-rose-400 scale-105 shadow-md shadow-rose-500/30'
                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/40 hover:border-rose-400'
              }`}
              title="Cubit pipi montok SIBEBEB!"
            >
              <span className="text-sm">🤏</span>
              <span>Pipi Gemoy</span>
            </button>

            {/* Pose 2 Jari Peace Sign Button */}
            <button
              onClick={() => onPoseChange?.('peace_sign')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-bold text-xs transition-all active:scale-95"
              title="Pose ✌️ Dua Jari"
            >
              <span className="text-sm">✌️</span>
              <span>Pose 2 Jari</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
