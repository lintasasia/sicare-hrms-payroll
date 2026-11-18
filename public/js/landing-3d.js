/**
 * siCare - 3D Interactive Calculator Device with Beveled Keys
 * Built with Three.js (r128 / r186 compatible) following Three.js Cloud Skills guidelines.
 * Features:
 * - Default view: TEGAP (straight front-facing, upright, non-tilted) exactly like the 2D UI.
 * - Colors: 100% identical to the original deep navy & rich corporate palette (#0c145e, #23459c, etc.).
 * - Fully Interactive 3D Rotation: User can click & drag (or touch drag) to rotate in all directions in 3D!
 * - Interactive hover parallax tilt when hovering with mouse.
 * - Double-click / tap to smoothly reset orientation back to tegap (0, 0).
 * - 9 Raised 3D Mechanical Calculator Keys with spring push click, hover lift, and idle wave.
 * - "Akses Semua Layanan Dalam Satu Portal" etched on the chassis face.
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

    // --- Exact Original Palette & Items (Exact 2D match) ---
    const gridItems = [
        // Row 0
        { row: 0, col: 0, icon: 'work', unicode: '\ue8f9', color: '#23459c', label: 'Lowongan Kerja' },
        { row: 0, col: 1, icon: 'badge', unicode: '\uea67', color: '#3d316e', label: 'Kartu Pegawai' },
        { row: 0, col: 2, icon: 'groups', unicode: '\uf233', color: '#322d7d', label: 'Struktur Tim' },
        // Row 1
        { row: 1, col: 0, icon: 'assignment', unicode: '\ue85d', color: '#20437d', label: 'Tugas & Cuti' },
        { row: 1, col: 1, icon: 'engineering', unicode: '\uea3d', color: '#443d63', label: 'Operasional' },
        { row: 1, col: 2, icon: 'corporate_fare', unicode: '\ue7e7', color: '#1d4686', label: 'Departemen' },
        // Row 2
        { row: 2, col: 0, icon: 'co_present', unicode: '\ueaf0', color: '#3d2b6e', label: 'Presensi ESS' },
        { row: 2, col: 1, icon: 'leaderboard', unicode: '\uf20c', color: '#1c3f87', label: 'KPI & Laporan' },
        { row: 2, col: 2, icon: 'handshake', unicode: '\uebc5', color: '#423561', label: 'Onboarding' }
    ];

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Camera positioned straight in front for clean, tegap view
    camera.position.set(0, 0, 18.6);
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

    // Use NoToneMapping so exact hex colors (#0c145e, #23459c, etc.) render at true RGB values
    renderer.toneMapping = THREE.NoToneMapping;

    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Master Device Group (Holds chassis + keys; fully rotatable in 3D) ---
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);

    // Default view: TEGAP (straight, 0 rotation, exactly like the 2D layout)
    deviceGroup.rotation.set(0, 0, 0);

    // --- Lighting: Balanced to preserve 100% color accuracy while giving 3D bevels ---
    // Pure white ambient light keeps front face colors solid and rich
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.98);
    scene.add(ambientLight);

    // Key directional light for bevel specular highlights and soft drop shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(12, 16, 18);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    scene.add(keyLight);

    // Subtle blue rim light from bottom left to delineate 3D edges
    const rimLight = new THREE.DirectionalLight(0x243b91, 0.5);
    rimLight.position.set(-14, -10, 10);
    scene.add(rimLight);

    // --- Soft Ground Contact Shadow (Behind Calculator) ---
    (function createGroundShadow() {
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const sctx = shadowCanvas.getContext('2d');

        const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        grad.addColorStop(0, 'rgba(8, 12, 60, 0.40)');
        grad.addColorStop(0.6, 'rgba(12, 20, 94, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 256, 256);

        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false,
            opacity: 0.75
        });
        const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16.5), shadowMat);
        shadowMesh.position.set(0, -0.2, -1.2);
        deviceGroup.add(shadowMesh);
    })();

    // --- 1. 3D Calculator Chassis / Body ---
    const chassisWidth = 11.4;
    const chassisHeight = 11.8;
    const chassisRadius = 1.45;
    const chassisDepth = 1.0;
    const chassisBevel = 0.32;

    const chassisShape = createRoundedRectShape(chassisWidth, chassisHeight, chassisRadius);
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
        depth: chassisDepth,
        bevelEnabled: true,
        bevelSegments: 6,
        steps: 1,
        bevelSize: chassisBevel,
        bevelThickness: chassisBevel,
        UVGenerator: createNormalizedUVGenerator(
            -chassisWidth / 2, chassisWidth / 2,
            -chassisHeight / 2, chassisHeight / 2
        )
    });
    chassisGeo.center();

    // Chassis Front Texture (Exact #0c145e dark navy, recessed tray & bottom text)
    const chassisCanvas = document.createElement('canvas');
    chassisCanvas.width = 1024;
    chassisCanvas.height = 1060;
    const cctx = chassisCanvas.getContext('2d');

    function renderChassisCanvas() {
        cctx.clearRect(0, 0, 1024, 1060);

        // Exact dark navy background matching original 2D container
        cctx.fillStyle = '#0c145e';
        cctx.fillRect(0, 0, 1024, 1060);

        // Inset keypad well where buttons sit
        cctx.save();
        cctx.fillStyle = '#080d44';
        drawRoundRect(cctx, 56, 56, 912, 860, 44);
        cctx.fill();

        // Well subtle inset border
        cctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        cctx.lineWidth = 3;
        cctx.stroke();
        cctx.restore();

        // Bottom text: "Akses Semua Layanan Dalam Satu Portal" (Exact match)
        cctx.save();
        cctx.fillStyle = '#a0a5db';
        cctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif';
        cctx.textAlign = 'right';
        cctx.textBaseline = 'middle';
        cctx.fillText('Akses Semua Layanan Dalam Satu Portal', 944, 986);
        cctx.restore();
    }

    renderChassisCanvas();
    const chassisTex = new THREE.CanvasTexture(chassisCanvas);
    chassisTex.anisotropy = 4;

    // Chassis side & bevel material: PBR for 3D highlights when rotated
    const chassisSideMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0c145e'),
        roughness: 0.35,
        metalness: 0.12
    });

    // Chassis front cap: MeshLambertMaterial so colors stay 100% solid & true to #0c145e
    const chassisFrontMat = new THREE.MeshLambertMaterial({
        map: chassisTex
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

            // Exact solid button color
            ctx.fillStyle = hexColor;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle inner key rim
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 504, 504);

            // Centered 2D White Material Symbols Icon
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Soft icon drop shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 4;

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
    const gridCenterY = 0.50; // centered in keypad well
    const chassisFrontZ = chassisDepth / 2 + chassisBevel; // ~0.82
    const buttonBaseZ = chassisFrontZ + buttonThickness / 2 + buttonBevel; // ~1.165

    const buttons = [];

    gridItems.forEach((item) => {
        const topTexture = makeKeyTexture(item.icon, item.unicode, item.color);

        // Sides and bevel material with specular sheen when rotated in 3D
        const sideMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(item.color),
            roughness: 0.30,
            metalness: 0.15
        });

        // Top face material: MeshLambertMaterial preserves 100% exact original color
        const frontMat = new THREE.MeshLambertMaterial({
            map: topTexture
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

    // --- Interactive 3D Rotation (Bisa Diputar-putar Bebas) & Raycasting ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredKey = null;

    // Rotation angles
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    let hoverTiltX = 0;
    let hoverTiltY = 0;

    // Drag interaction tracking
    let isDragging = false;
    let previousPointer = { x: 0, y: 0 };
    let pointerDownPos = { x: 0, y: 0 };
    let dragDistance = 0;

    function getNDC(clientX, clientY) {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
        return {
            x: ((clientX - rect.left) / rect.width) * 2 - 1,
            y: -((clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    // Pointer Down (Mouse click or touch start)
    container.addEventListener('pointerdown', (e) => {
        isDragging = true;
        previousPointer = { x: e.clientX, y: e.clientY };
        pointerDownPos = { x: e.clientX, y: e.clientY };
        dragDistance = 0;
        container.style.cursor = 'grabbing';
    });

    // Pointer Move (Mouse move or touch drag)
    window.addEventListener('pointermove', (e) => {
        const ndc = getNDC(e.clientX, e.clientY);
        mouse.x = ndc.x;
        mouse.y = ndc.y;

        if (isDragging) {
            const dx = e.clientX - previousPointer.x;
            const dy = e.clientY - previousPointer.y;
            dragDistance += Math.abs(dx) + Math.abs(dy);

            // Free 3D rotation speed
            targetRotY += dx * 0.007;
            targetRotX += dy * 0.007;

            // Clamp vertical pitch so device stays readable
            targetRotX = Math.max(-Math.PI * 0.42, Math.min(Math.PI * 0.42, targetRotX));

            previousPointer = { x: e.clientX, y: e.clientY };
        } else {
            // Subtle hover parallax tilt when not dragging
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const cx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                const cy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
                hoverTiltY = cx * 0.08;
                hoverTiltX = -cy * 0.06;
            }
        }
    });

    // Pointer Up (Mouse release or touch end)
    window.addEventListener('pointerup', (e) => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'grab';

            // If user clicked without dragging (dragDistance < 6px), treat as button push
            if (dragDistance < 6) {
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(buttons);
                if (hits.length > 0) {
                    const hitKey = hits[0].object;
                    hitKey.userData.pressOffset = -0.32;
                }
            }
        }
    });

    container.addEventListener('mouseleave', () => {
        mouse.x = -999;
        mouse.y = -999;
        hoverTiltX = 0;
        hoverTiltY = 0;
    });

    // Double-click resets rotation smoothly back to TEGAP (0, 0)
    container.addEventListener('dblclick', () => {
        targetRotX = 0;
        targetRotY = 0;
    });

    container.style.cursor = 'grab';

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

        // Raycasting for hover state on buttons (only when not dragging)
        if (!isDragging) {
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
                    container.style.cursor = 'grab';
                }
            }
        }

        // Animate each 3D button
        buttons.forEach((key) => {
            const u = key.userData;

            // 1. Subtle breathing wave
            const wave = Math.sin(elapsedTime * 1.8 + (u.row + u.col) * 0.7) * 0.05;

            // 2. Hover elevation lift
            const hoverLift = u.isHovered ? 0.26 : 0;

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

        // Smooth device rotation (dragged 3D rotation + hover parallax)
        rotX += ((targetRotX + hoverTiltX) - rotX) * 0.08;
        rotY += ((targetRotY + hoverTiltY) - rotY) * 0.08;

        deviceGroup.rotation.x = rotX;
        deviceGroup.rotation.y = rotY;

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
