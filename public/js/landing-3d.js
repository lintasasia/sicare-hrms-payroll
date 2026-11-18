/**
 * siCare - 3D Interactive Calculator Device with Beveled Keys
 * Built with Three.js (r128 / r186 compatible) following Three.js Cloud Skills guidelines.
 * Features:
 * - 3D Calculator Chassis / Body: Chunky rounded beveled casing in dark navy (#0c145e)
 * - Inset Keypad Tray with subtle depth & specular sheen
 * - 9 Raised 3D Mechanical Calculator Keys with original rich corporate colors
 * - Crisp centered 2D Material Symbols icons with dynamic font loading
 * - Direct contact shadows from keys onto chassis & soft ground shadow
 * - Interactive spring push click, hover lift, staggered wave breathing, and 3D parallax tilt
 * - "Akses Semua Layanan Dalam Satu Portal" etched on chassis face
 */

(function () {
    const container = document.getElementById('sicare-3d-container');
    if (!container || typeof THREE === 'undefined') return;

    // --- Helper for 2D Rounded Rectangle Path (Cross-browser Canvas) ---
    function drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // --- Helper for Three.js Shape Rounded Rectangle ---
    function createRoundedRectShape(width, height, radius) {
        const shape = new THREE.Shape();
        const halfW = width / 2;
        const halfH = height / 2;
        const r = Math.min(radius, halfW, halfH);

        shape.moveTo(-halfW + r, -halfH);
        shape.lineTo(halfW - r, -halfH);
        shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
        shape.lineTo(halfW, halfH - r);
        shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
        shape.lineTo(-halfW + r, halfH);
        shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
        shape.lineTo(-halfW, -halfH + r);
        shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
        return shape;
    }

    // --- Custom UV Generator for ExtrudeGeometry to map 0..1 to front cap ---
    function createNormalizedUVGenerator(minX, maxX, minY, maxY) {
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        return {
            generateTopUV: function (geometry, vertices, indexA, indexB, indexC) {
                const ax = (vertices[indexA * 3] - minX) / rangeX;
                const ay = (vertices[indexA * 3 + 1] - minY) / rangeY;
                const bx = (vertices[indexB * 3] - minX) / rangeX;
                const by = (vertices[indexB * 3 + 1] - minY) / rangeY;
                const cx = (vertices[indexC * 3] - minX) / rangeX;
                const cy = (vertices[indexC * 3 + 1] - minY) / rangeY;
                return [
                    new THREE.Vector2(ax, ay),
                    new THREE.Vector2(bx, by),
                    new THREE.Vector2(cx, cy)
                ];
            },
            generateSideWallUV: function () {
                return [
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(1, 1),
                    new THREE.Vector2(0, 1)
                ];
            }
        };
    }

    // --- Grid Items Specification (9 Calculator Keys) ---
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

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Camera positioned with pleasant isometric viewing distance
    camera.position.set(0, 0, 22.5);
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
    renderer.toneMappingExposure = 1.15;

    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Master Device Group (Everything tilts together like a physical calculator) ---
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);

    // Default isometric tilt so the thick 3D bevels and sides are clearly prominent
    const baseRotX = 0.28;   // pitch downward towards viewer
    const baseRotY = -0.26;  // yaw left so right and top side walls are visible
    const baseRotZ = 0.02;
    deviceGroup.rotation.set(baseRotX, baseRotY, baseRotZ);

    // --- Lighting: Key light for bevel highlights + soft fill & ambient ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111638, 0.85);
    scene.add(hemiLight);

    // Key directional light (casts crisp soft shadows from keys onto chassis & chassis onto floor)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(14, 18, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    scene.add(keyLight);

    // Rim light from bottom-left for edge delineation
    const rimLight = new THREE.DirectionalLight(0x7c8cf8, 0.7);
    rimLight.position.set(-14, -10, 10);
    scene.add(rimLight);

    // --- Soft Ground Contact Shadow (Behind Calculator) ---
    (function createGroundShadow() {
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const sctx = shadowCanvas.getContext('2d');

        const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        grad.addColorStop(0, 'rgba(12, 20, 94, 0.45)');
        grad.addColorStop(0.5, 'rgba(8, 12, 60, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 256, 256);

        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false,
            opacity: 0.85
        });
        const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 17), shadowMat);
        shadowMesh.position.set(0.6, -0.6, -1.2);
        deviceGroup.add(shadowMesh);
    })();

    // --- 1. 3D Calculator Chassis / Body ---
    const chassisWidth = 11.4;
    const chassisHeight = 12.0;
    const chassisRadius = 1.5;
    const chassisDepth = 1.0;
    const chassisBevel = 0.35;

    const chassisShape = createRoundedRectShape(chassisWidth, chassisHeight, chassisRadius);
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
        depth: chassisDepth,
        bevelEnabled: true,
        bevelSegments: 7,
        steps: 1,
        bevelSize: chassisBevel,
        bevelThickness: chassisBevel,
        UVGenerator: createNormalizedUVGenerator(
            -chassisWidth / 2, chassisWidth / 2,
            -chassisHeight / 2, chassisHeight / 2
        )
    });
    chassisGeo.center();

    // Chassis Front Texture (Keypad recessed tray, branding & bottom label)
    const chassisCanvas = document.createElement('canvas');
    chassisCanvas.width = 1024;
    chassisCanvas.height = 1078; // proportional to 11.4 x 12.0
    const cctx = chassisCanvas.getContext('2d');

    function renderChassisCanvas() {
        cctx.clearRect(0, 0, 1024, 1078);

        // Solid rich dark navy body
        cctx.fillStyle = '#0c145e';
        cctx.fillRect(0, 0, 1024, 1078);

        // Elegant lighting sheen from top
        const sheen = cctx.createLinearGradient(0, 0, 0, 1078);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
        sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.0)');
        sheen.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        cctx.fillStyle = sheen;
        cctx.fillRect(0, 0, 1024, 1078);

        // Recessed keypad well / tray (where the 9 buttons sit)
        cctx.save();
        // Inner well shadow
        cctx.fillStyle = '#090e44';
        drawRoundRect(cctx, 58, 64, 908, 868, 48);
        cctx.fill();

        // Well subtle inset border
        cctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        cctx.lineWidth = 4;
        cctx.stroke();

        // Subtle gradient inside the well for realistic recessed depth
        const wellGrad = cctx.createLinearGradient(0, 64, 0, 932);
        wellGrad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
        wellGrad.addColorStop(0.15, 'rgba(0, 0, 0, 0.0)');
        wellGrad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
        cctx.fillStyle = wellGrad;
        drawRoundRect(cctx, 58, 64, 908, 868, 48);
        cctx.fill();
        cctx.restore();

        // Subtle top accent bar (calculator hardware detail)
        cctx.fillStyle = 'rgba(160, 165, 219, 0.25)';
        drawRoundRect(cctx, 84, 34, 52, 6, 3);
        cctx.fill();

        // Bottom text: "Akses Semua Layanan Dalam Satu Portal"
        cctx.save();
        cctx.fillStyle = '#a0a5db';
        cctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif';
        cctx.textAlign = 'right';
        cctx.textBaseline = 'middle';
        cctx.fillText('Akses Semua Layanan Dalam Satu Portal', 944, 996);
        cctx.restore();
    }

    renderChassisCanvas();
    const chassisTex = new THREE.CanvasTexture(chassisCanvas);
    chassisTex.anisotropy = 4;

    const chassisSideMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0c145e'),
        roughness: 0.35,
        metalness: 0.14
    });

    const chassisFrontMat = new THREE.MeshStandardMaterial({
        map: chassisTex,
        roughness: 0.32,
        metalness: 0.10
    });

    const chassisMesh = new THREE.Mesh(chassisGeo, [chassisFrontMat, chassisSideMat]);
    chassisMesh.receiveShadow = true;
    chassisMesh.castShadow = true;
    deviceGroup.add(chassisMesh);

    // --- 2. 9 Raised 3D Calculator Keys / Buttons ---
    const buttonSize = 2.45;
    const buttonThickness = 0.45;
    const buttonRadius = 0.42;
    const buttonBevel = 0.12;

    const buttonShape = createRoundedRectShape(buttonSize, buttonSize, buttonRadius);
    const buttonGeo = new THREE.ExtrudeGeometry(buttonShape, {
        depth: buttonThickness,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: buttonBevel,
        bevelThickness: buttonBevel,
        UVGenerator: createNormalizedUVGenerator(
            -buttonSize / 2, buttonSize / 2,
            -buttonSize / 2, buttonSize / 2
        )
    });
    buttonGeo.center();

    // Canvas Texture generator for each button's front face
    function makeKeyTexture(iconName, unicodeGlyph, hexColor) {
        const cvs = document.createElement('canvas');
        cvs.width = 512;
        cvs.height = 512;
        const ctx = cvs.getContext('2d');

        function renderKey() {
            ctx.clearRect(0, 0, 512, 512);

            // Button base color
            ctx.fillStyle = hexColor;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle surface gradient sheen
            const sheen = ctx.createLinearGradient(0, 0, 0, 512);
            sheen.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
            sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0.0)');
            sheen.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
            ctx.fillStyle = sheen;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle inner key rim
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 502, 502);

            // Centered 2D White Material Symbols Icon
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Soft icon drop shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.30)';
            ctx.shadowBlur = 16;
            ctx.shadowOffsetY = 6;

            ctx.font = 'normal 210px "Material Symbols Outlined", sans-serif';
            const glyph = unicodeGlyph || iconName;
            ctx.fillText(glyph, 256, 260);
            ctx.restore();
        }

        renderKey();
        const tex = new THREE.CanvasTexture(cvs);
        tex.anisotropy = 4;

        if (document.fonts) {
            document.fonts.ready.then(() => {
                renderKey();
                tex.needsUpdate = true;
            });
        }

        return tex;
    }

    // Grid layout parameters
    const spacing = 2.92;
    const gridCenterY = 0.52; // centered nicely inside the keypad well
    const chassisFrontZ = chassisDepth / 2 + chassisBevel; // ~0.85
    const buttonBaseZ = chassisFrontZ + buttonThickness / 2 + buttonBevel; // ~1.195

    const buttons = [];

    gridItems.forEach((item) => {
        const topTexture = makeKeyTexture(item.icon, item.unicode, item.color);

        // Sides and bevel material with specular sheen
        const sideMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(item.color),
            roughness: 0.30,
            metalness: 0.16
        });

        // Top face material
        const frontMat = new THREE.MeshStandardMaterial({
            map: topTexture,
            roughness: 0.28,
            metalness: 0.08
        });

        const keyMesh = new THREE.Mesh(buttonGeo, [frontMat, sideMat]);

        // Position in local deviceGroup space
        const posX = (item.col - 1) * spacing;
        const posY = -(item.row - 1) * spacing + gridCenterY;

        keyMesh.position.set(posX, posY, buttonBaseZ);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = false;

        keyMesh.userData = {
            baseX: posX,
            baseY: posY,
            baseZ: buttonBaseZ,
            currentZ: buttonBaseZ,
            targetZ: buttonBaseZ,
            pressOffset: 0,
            row: item.row,
            col: item.col,
            isHovered: false
        };

        deviceGroup.add(keyMesh);
        buttons.push(keyMesh);
    });

    // --- Interactive Raycasting & Parallax Tilt ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredKey = null;

    let targetTiltX = baseRotX;
    let targetTiltY = baseRotY;

    function updateMouse(clientX, clientY) {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        // Device tilt based on mouse position
        const cx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const cy = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

        targetTiltY = baseRotY + cx * 0.18;
        targetTiltX = baseRotX - cy * 0.14;
    }

    container.addEventListener('mousemove', (e) => {
        updateMouse(e.clientX, e.clientY);
    });

    container.addEventListener('mouseleave', () => {
        mouse.x = -999;
        mouse.y = -999;
        targetTiltX = baseRotX;
        targetTiltY = baseRotY;
    });

    // Realistic spring click on calculator buttons
    container.addEventListener('click', (e) => {
        updateMouse(e.clientX, e.clientY);
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(buttons);
        if (hits.length > 0) {
            const hitKey = hits[0].object;
            // Push key down into the calculator body
            hitKey.userData.pressOffset = -0.32;
        }
    });

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    // --- Animation Loop ---
    const clock = new THREE.Clock();
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

        // Raycasting for hover state
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(buttons);
        const activeHit = hits.length > 0 ? hits[0].object : null;

        if (activeHit !== hoveredKey) {
            if (hoveredKey) {
                hoveredKey.userData.isHovered = false;
            }
            hoveredKey = activeHit;
            if (hoveredKey) {
                hoveredKey.userData.isHovered = true;
                container.style.cursor = 'pointer';
            } else {
                container.style.cursor = 'default';
            }
        }

        // Animate each 3D button
        buttons.forEach((key) => {
            const u = key.userData;

            // 1. Subtle breathing wave
            const wave = Math.sin(elapsedTime * 1.8 + (u.row + u.col) * 0.7) * 0.06;

            // 2. Hover elevation lift
            const hoverLift = u.isHovered ? 0.28 : 0;

            // 3. Spring press recovery (lerp back to 0)
            u.pressOffset += (0 - u.pressOffset) * 0.18;

            // Compute target Z
            u.targetZ = u.baseZ + wave + hoverLift + u.pressOffset;

            // Smooth interpolation
            u.currentZ += (u.targetZ - u.currentZ) * 0.14;
            key.position.z = u.currentZ;

            // Subtle scale pulse on hover
            const targetScale = u.isHovered ? 1.03 : 1.0;
            key.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
        });

        // Smooth device tilt (parallax)
        deviceGroup.rotation.x += (targetTiltX - deviceGroup.rotation.x) * 0.065;
        deviceGroup.rotation.y += (targetTiltY - deviceGroup.rotation.y) * 0.065;

        renderer.render(scene, camera);
    }

    animate();

    // --- Responsive Resize ---
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
