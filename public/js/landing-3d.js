/**
 * siCare - 3D Interactive Isometric Grid
 * Built with Three.js (r128 / r186 compatible) following Three.js Cloud Skills guidelines.
 * Matches original design exactly:
 * - 9 physical 3D rounded beveled tiles inside the #0c145e dark container
 * - Original rich corporate palette (#243b91, #3e2f6b, #322c7a, etc.)
 * - Crisp white Material Symbol icons centered on top
 * - Specular bevel highlights and soft self-shadowing
 * - Subtle floating wave animation + interactive mouse parallax & hover lift
 */

(function () {
    const container = document.getElementById('sicare-3d-container');
    if (!container || typeof THREE === 'undefined') return;

    // --- Original 9 Tiles Specification (from hero layout) ---
    const gridItems = [
        // Row 0
        { row: 0, col: 0, icon: 'work', unicode: '\ue8f9', color: '#243b91', label: 'Lowongan Kerja' },
        { row: 0, col: 1, icon: 'badge', unicode: '\uea67', color: '#3e2f6b', label: 'Kartu Pegawai' },
        { row: 0, col: 2, icon: 'groups', unicode: '\uf233', color: '#322c7a', label: 'Struktur Tim' },
        // Row 1
        { row: 1, col: 0, icon: 'assignment', unicode: '\ue85d', color: '#1f4277', label: 'Tugas & Cuti' },
        { row: 1, col: 1, icon: 'engineering', unicode: '\uea3d', color: '#423d61', label: 'Operasional' },
        { row: 1, col: 2, icon: 'corporate_fare', unicode: '\ue7e7', color: '#1e4682', label: 'Departemen' },
        // Row 2
        { row: 2, col: 0, icon: 'co_present', unicode: '\ueaf0', color: '#3c2a6d', label: 'Presensi ESS' },
        { row: 2, col: 1, icon: 'leaderboard', unicode: '\uf20c', color: '#1c3f87', label: 'KPI & Laporan' },
        { row: 2, col: 2, icon: 'handshake', unicode: '\uebc5', color: '#433660', label: 'Onboarding' }
    ];

    // --- Scene & Camera Setup ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 440;

    // Perspective camera facing the 3x3 grid with subtle 3D depth
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 13.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Master Pivot Group for 3D Tilt & Parallax ---
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    // Initial slight 3D perspective orientation
    let baseRotX = 0.12;   // slight pitch down so top bevel catches light
    let baseRotY = -0.10;  // slight yaw left
    gridGroup.rotation.x = baseRotX;
    gridGroup.rotation.y = baseRotY;

    // --- Lighting: Key light, Soft fill, and Ambient ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e1b4b, 0.8);
    scene.add(hemiLight);

    // Key Directional Light (creates specular highlights on the beveled edges)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(10, 14, 15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft rim light from bottom-left for depth
    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.6);
    rimLight.position.set(-10, -8, 8);
    scene.add(rimLight);

    // --- Geometry: 3D Rounded Beveled Tile ---
    const blockSize = 2.65;
    const blockThickness = 0.55;
    const cornerRadius = 0.45;

    // Create 2D Rounded Rectangle Shape
    const shape = new THREE.Shape();
    const half = blockSize / 2;
    const r = cornerRadius;
    shape.moveTo(-half + r, -half);
    shape.lineTo(half - r, -half);
    shape.quadraticCurveTo(half, -half, half, -half + r);
    shape.lineTo(half, half - r);
    shape.quadraticCurveTo(half, half, half - r, half);
    shape.lineTo(-half + r, half);
    shape.quadraticCurveTo(-half, half, -half, half - r);
    shape.lineTo(-half, -half + r);
    shape.quadraticCurveTo(-half, -half, -half + r, -half);

    const extrudeSettings = {
        depth: blockThickness,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: 0.12,
        bevelThickness: 0.12
    };
    const blockGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    blockGeo.center(); // Center around origin

    // --- Function to Create Crisp Icon Texture for the Front Face ---
    function makeIconTexture(iconName, unicodeGlyph, hexColor) {
        const cvs = document.createElement('canvas');
        cvs.width = 512;
        cvs.height = 512;
        const ctx = cvs.getContext('2d');

        function renderCanvas() {
            ctx.clearRect(0, 0, cvs.width, cvs.height);

            // Solid rich background matching the original tile
            ctx.fillStyle = hexColor;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle top-down gradient sheen
            const sheen = ctx.createLinearGradient(0, 0, 0, 512);
            sheen.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
            sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
            sheen.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = sheen;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle inner border line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 504, 504);

            // Centered 2D White Icon (Material Symbols)
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Soft drop shadow under icon
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 4;

            ctx.font = 'normal 210px "Material Symbols Outlined", sans-serif';

            const glyph = unicodeGlyph || iconName;
            ctx.fillText(glyph, 256, 260);
            ctx.restore();
        }

        renderCanvas();
        const tex = new THREE.CanvasTexture(cvs);
        tex.anisotropy = 4;

        if (document.fonts) {
            document.fonts.ready.then(() => {
                renderCanvas();
                tex.needsUpdate = true;
            });
        }

        return tex;
    }

    // --- Build 3x3 Grid of 3D Blocks ---
    const spacing = 3.25;
    const blocks = [];

    gridItems.forEach((item) => {
        const topTexture = makeIconTexture(item.icon, item.unicode, item.color);

        // Sides and bevel material (matching rich dark tone with subtle specular shine)
        const sideMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(item.color),
            roughness: 0.32,
            metalness: 0.15
        });

        // Front face material with icon texture
        const frontMat = new THREE.MeshStandardMaterial({
            map: topTexture,
            roughness: 0.28,
            metalness: 0.08
        });

        // ExtrudeGeometry materials: [front/back caps, sides/bevels]
        const mesh = new THREE.Mesh(blockGeo, [frontMat, sideMat]);

        // Position on XY plane (Col -1, 0, 1 and Row 1, 0, -1)
        const posX = (item.col - 1) * spacing;
        const posY = -(item.row - 1) * spacing; // row 0 at top (+Y), row 2 at bottom (-Y)

        mesh.position.set(posX, posY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            baseX: posX,
            baseY: posY,
            baseZ: 0,
            targetZ: 0,
            currentZ: 0,
            row: item.row,
            col: item.col,
            color: item.color,
            isHovered: false
        };

        gridGroup.add(mesh);
        blocks.push(mesh);
    });

    // --- Raycasting for Interactive Hover & Click ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredMesh = null;

    function getMouseCoords(e) {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    let targetTiltX = baseRotX;
    let targetTiltY = baseRotY;

    container.addEventListener('mousemove', (e) => {
        getMouseCoords(e);
        const rect = container.getBoundingClientRect();
        const cx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const cy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

        // Smooth 3D parallax tilt within safe angle limits
        targetTiltY = baseRotY + cx * 0.18;
        targetTiltX = baseRotX - cy * 0.14;
    });

    container.addEventListener('mouseleave', () => {
        mouse.x = -999;
        mouse.y = -999;
        targetTiltX = baseRotX;
        targetTiltY = baseRotY;
    });

    container.addEventListener('click', (e) => {
        getMouseCoords(e);
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(blocks);
        if (hits.length > 0) {
            const hit = hits[0].object;
            // Spring press reaction
            hit.userData.currentZ = -0.35;
        }
    });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            getMouseCoords(e.touches[0]);
        }
    }, { passive: true });

    // --- Animation Loop ---
    let clock = new THREE.Clock();
    let isVisible = true;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0.05 });
        observer.observe(container);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;

        const elapsedTime = clock.getElapsedTime();

        // Check hover
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(blocks);
        const activeHit = hits.length > 0 ? hits[0].object : null;

        if (activeHit !== hoveredMesh) {
            if (hoveredMesh) {
                hoveredMesh.userData.isHovered = false;
            }
            hoveredMesh = activeHit;
            if (hoveredMesh) {
                hoveredMesh.userData.isHovered = true;
                container.style.cursor = 'pointer';
            } else {
                container.style.cursor = 'default';
            }
        }

        // Animate each of the 9 3D blocks
        blocks.forEach((mesh) => {
            const u = mesh.userData;
            // 1. Staggered organic 3D breathing wave
            const waveZ = Math.sin(elapsedTime * 1.8 + (u.row + u.col) * 0.7) * 0.16;

            // 2. Hover lift toward camera
            const hoverLift = u.isHovered ? 0.65 : 0;
            u.targetZ = waveZ + hoverLift;

            // Smooth interpolation (lerp)
            u.currentZ += (u.targetZ - u.currentZ) * 0.12;
            mesh.position.z = u.baseZ + u.currentZ;

            // Subtle scale pulse on hover
            const targetScale = u.isHovered ? 1.04 : 1.0;
            mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        });

        // 3. Smooth grid tilt interpolation (parallax)
        gridGroup.rotation.x += (targetTiltX - gridGroup.rotation.x) * 0.06;
        gridGroup.rotation.y += (targetTiltY - gridGroup.rotation.y) * 0.06;

        renderer.render(scene, camera);
    }

    animate();

    // --- Responsive Resize (Window & ResizeObserver for flexbox layout) ---
    function handleResize() {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight || newWidth;
        if (newWidth === 0 || newHeight === 0) return;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', handleResize);
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(handleResize);
        ro.observe(container);
    }
})();
