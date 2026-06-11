/* ==========================================
   APP TAB NAVIGATION
   ========================================== */
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Find matching tab button
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });

    // Specific tab activations
    if (tabId === 'builder') {
        initBuilderCanvas();
    }
}

/* ==========================================
   CAROUSEL LOGIC (CULTURE PAGE)
   ========================================== */
let currentSlideIdx = 0;
const slides = ['slide1', 'slide2'];

function showSlide(index) {
    slides.forEach((slideId, i) => {
        const slide = document.getElementById(slideId);
        if (i === index) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    
    // Update indicator
    const indicator = document.querySelector('.carousel-indicator');
    if (indicator) {
        indicator.textContent = `${index + 1} / ${slides.length}`;
    }
}

function nextSlide() {
    currentSlideIdx = (currentSlideIdx + 1) % slides.length;
    showSlide(currentSlideIdx);
}

function prevSlide() {
    currentSlideIdx = (currentSlideIdx - 1 + slides.length) % slides.length;
    showSlide(currentSlideIdx);
}

/* ==========================================
   3D KILN BUILDER (ISOMETRIC CANVAS)
   ========================================== */
let builderCanvas, builderCtx;
const gridCols = 5; // X-axis (length)
const gridRows = 3; // Y-axis (width)
const maxBlocksH = 3; // Z-axis (max height)
let heightMap = []; // 2D array of heights
let isSplitMode = false;

// Block rendering size params
const blockWidth = 60;
const blockHeight = 30;
const blockDepth = 26; // Height offset for Z layer

function initBuilderCanvas() {
    builderCanvas = document.getElementById('builder-canvas');
    if (!builderCanvas) return;
    builderCtx = builderCanvas.getContext('2d');
    
    // Set proper size based on wrapper
    const rect = builderCanvas.parentElement.getBoundingClientRect();
    builderCanvas.width = rect.width;
    builderCanvas.height = 420;
    
    // Initialize height map if empty
    if (heightMap.length === 0) {
        loadPreset('traditional');
    }
    
    drawBuilder();
    
    // Add event listeners
    builderCanvas.removeEventListener('click', handleBuilderClick);
    builderCanvas.addEventListener('click', handleBuilderClick);
}

function loadPreset(type) {
    heightMap = Array(gridCols).fill().map(() => Array(gridRows).fill(0));
    
    if (type === 'traditional') {
        // Front low, back high slope (X axis represents length front-to-back slope)
        for (let x = 0; x < gridCols; x++) {
            let h = 1;
            if (x === 1 || x === 2) h = 2;
            if (x === 3 || x === 4) h = 3;
            for (let y = 0; y < gridRows; y++) {
                heightMap[x][y] = h;
            }
        }
    } else if (type === 'cube') {
        // Flat block
        for (let x = 0; x < gridCols; x++) {
            for (let y = 0; y < gridRows; y++) {
                heightMap[x][y] = 2;
            }
        }
    }
    
    updateBuilderStats();
    if (builderCtx) drawBuilder();
}

function clearGrid() {
    heightMap = Array(gridCols).fill().map(() => Array(gridRows).fill(0));
    updateBuilderStats();
    if (builderCtx) drawBuilder();
}

function toggleSplitMode() {
    isSplitMode = document.getElementById('split-mode-checkbox').checked;
    document.getElementById('split-explanation').style.display = isSplitMode ? 'block' : 'none';
    drawBuilder();
}

// Calculate screen coordinates from isometric grid (x, y, z)
function getIsoCoords(x, y, z) {
    // Translate origin to middle-ish of canvas
    const originX = builderCanvas.width / 2;
    const originY = builderCanvas.height / 2 + 60;
    
    // Isometric projection
    const screenX = originX + (x - y) * (blockWidth / 2);
    const screenY = originY + (x + y) * (blockHeight / 2) - z * blockDepth;
    
    return { x: screenX, y: screenY };
}

// Draw a single isometric block
function drawBlock(ctx, gx, gy, gz, colorTop, colorLeft, colorRight) {
    const coords = getIsoCoords(gx, gy, gz);
    const cx = coords.x;
    const cy = coords.y;
    
    const w2 = blockWidth / 2;
    const h2 = blockHeight / 2;
    const d = blockDepth;
    
    // 1. Draw Left Face
    ctx.fillStyle = colorLeft;
    ctx.beginPath();
    ctx.moveTo(cx - w2, cy);
    ctx.lineTo(cx, cy + h2);
    ctx.lineTo(cx, cy + h2 + d);
    ctx.lineTo(cx - w2, cy + d);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();

    // 2. Draw Right Face
    ctx.fillStyle = colorRight;
    ctx.beginPath();
    ctx.moveTo(cx, cy + h2);
    ctx.lineTo(cx + w2, cy);
    ctx.lineTo(cx + w2, cy + d);
    ctx.lineTo(cx, cy + h2 + d);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Draw Top Face
    ctx.fillStyle = colorTop;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + w2, cy - h2);
    ctx.lineTo(cx, cy - 2 * h2);
    ctx.lineTo(cx - w2, cy - h2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Draw the entire isometric workspace
function drawBuilder() {
    if (!builderCtx) return;
    
    // Clear canvas
    builderCtx.clearRect(0, 0, builderCanvas.width, builderCanvas.height);
    
    // 1. Draw Grid Floor
    for (let x = 0; x < gridCols; x++) {
        for (let y = 0; y < gridRows; y++) {
            const coords = getIsoCoords(x, y, 0);
            const cx = coords.x;
            const cy = coords.y;
            const w2 = blockWidth / 2;
            const h2 = blockHeight / 2;
            
            builderCtx.fillStyle = 'rgba(30, 41, 59, 0.3)';
            builderCtx.strokeStyle = 'rgba(255,255,255,0.06)';
            builderCtx.beginPath();
            builderCtx.moveTo(cx, cy);
            builderCtx.lineTo(cx + w2, cy - h2);
            builderCtx.lineTo(cx, cy - 2 * h2);
            builderCtx.lineTo(cx - w2, cy - h2);
            builderCtx.closePath();
            builderCtx.fill();
            builderCtx.stroke();
        }
    }
    
    // 2. Draw Stacked Blocks (Back-to-Front painter algorithm)
    // Render loop order: x goes 0 -> gridCols-1, y goes 0 -> gridRows-1
    for (let x = 0; x < gridCols; x++) {
        for (let y = 0; y < gridRows; y++) {
            const height = heightMap[x][y];
            for (let z = 0; z < height; z++) {
                let colorTop = '#64748b';    // Standard slate gray
                let colorLeft = '#475569';
                let colorRight = '#334155';
                
                if (isSplitMode) {
                    if (z === 0) {
                        // Foundation Rectangular Prism (Greenish Slate)
                        colorTop = '#34d399';
                        colorLeft = '#059669';
                        colorRight = '#047857';
                    } else {
                        // Upper slope / Triangular Prism (Blueish Slate)
                        colorTop = '#60a5fa';
                        colorLeft = '#2563eb';
                        colorRight = '#1d4ed8';
                    }
                }
                
                drawBlock(builderCtx, x, y, z + 1, colorTop, colorLeft, colorRight);
            }
        }
    }
}

// Handle Mouse Click on the Grid to add/remove blocks
function handleBuilderClick(e) {
    const rect = builderCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Check if Shift is held down (for removal)
    const isRemove = e.shiftKey;
    
    // Raycasting or bounding checks in reverse order (Front-to-Back) to see which column cell was clicked
    // We map mouse to the isometric columns.
    let clickedCell = null;
    let maxSortVal = -9999;
    
    for (let x = 0; x < gridCols; x++) {
        for (let y = 0; y < gridRows; y++) {
            // Find screen bounds of this column's top block (or ground if 0)
            const h = heightMap[x][y];
            const coords = getIsoCoords(x, y, h); // Anchor point is bottom center of the block top face
            
            // Check distance of click to top face center
            // Let's do a diamond hitbox check
            const dx = mx - coords.x;
            const dy = my - (coords.y - blockHeight/2);
            
            // Equation of isometric diamond boundary: |dx| / (w/2) + |dy| / (h/2) <= 1
            if (Math.abs(dx) / (blockWidth/2) + Math.abs(dy) / (blockHeight/2) <= 1.2) {
                // To handle overlapping, we pick the column closest to the screen (higher x+y)
                const sortVal = x + y;
                if (sortVal > maxSortVal) {
                    maxSortVal = sortVal;
                    clickedCell = { x, y };
                }
            }
        }
    }
    
    if (clickedCell) {
        const cx = clickedCell.x;
        const cy = clickedCell.y;
        
        if (isRemove) {
            if (heightMap[cx][cy] > 0) {
                heightMap[cx][cy]--;
                triggerScoreEffect(10);
            }
        } else {
            if (heightMap[cx][cy] < maxBlocksH) {
                heightMap[cx][cy]++;
                triggerScoreEffect(10);
            }
        }
        
        updateBuilderStats();
        drawBuilder();
    }
}

function updateBuilderStats() {
    let blockCount = 0;
    let actualLength = 0;
    let actualWidth = 0;
    let actualHeight = 0;
    
    // Determine bounds
    for (let x = 0; x < gridCols; x++) {
        let colHasBlocks = false;
        for (let y = 0; y < gridRows; y++) {
            const h = heightMap[x][y];
            blockCount += h;
            if (h > 0) {
                colHasBlocks = true;
                actualHeight = Math.max(actualHeight, h);
            }
        }
        if (colHasBlocks) {
            actualLength = Math.max(actualLength, x + 1);
        }
    }
    
    for (let y = 0; y < gridRows; y++) {
        let rowHasBlocks = false;
        for (let x = 0; x < gridCols; x++) {
            if (heightMap[x][y] > 0) rowHasBlocks = true;
        }
        if (rowHasBlocks) {
            actualWidth = Math.max(actualWidth, y + 1);
        }
    }
    
    // 1 block = 20cm * 20cm * 20cm = 8000 cm³
    const blockVol = 8000;
    const totalVol = blockCount * blockVol;
    
    // Exposed surface area calculation
    let exposedFaces = 0;
    for (let x = 0; x < gridCols; x++) {
        for (let y = 0; y < gridRows; y++) {
            const h = heightMap[x][y];
            if (h === 0) continue;
            
            // Top face is always exposed
            exposedFaces += 1;
            
            // Left (x-1, y) faces exposed?
            const adjLeftH = (x > 0) ? heightMap[x-1][y] : 0;
            if (h > adjLeftH) exposedFaces += (h - adjLeftH);
            
            // Right (x+1, y) faces exposed?
            const adjRightH = (x < gridCols - 1) ? heightMap[x+1][y] : 0;
            if (h > adjRightH) exposedFaces += (h - adjRightH);
            
            // Front (x, y-1) faces exposed?
            const adjFrontH = (y > 0) ? heightMap[x][y-1] : 0;
            if (h > adjFrontH) exposedFaces += (h - adjFrontH);
            
            // Back (x, y+1) faces exposed?
            const adjBackH = (y < gridRows - 1) ? heightMap[x][y+1] : 0;
            if (h > adjBackH) exposedFaces += (h - adjBackH);
        }
    }
    
    // 1 block face = 20cm * 20cm = 400 cm²
    const faceArea = 400;
    const totalSurface = exposedFaces * faceArea;
    
    // Update labels
    document.getElementById('val-length').textContent = `${actualLength} 格 (${actualLength * 20} cm)`;
    document.getElementById('val-width').textContent = `${actualWidth} 格 (${actualWidth * 20} cm)`;
    document.getElementById('val-height').textContent = `${actualHeight} 格 (${actualHeight * 20} cm)`;
    document.getElementById('val-volume').innerHTML = `${blockCount} 格 <small>(${totalVol.toLocaleString()} cm³)</small>`;
    document.getElementById('val-surface').innerHTML = `${exposedFaces} 面 <small>(${totalSurface.toLocaleString()} cm²)</small>`;
}

/* ==========================================
   TARO PACKING SIMULATOR (DRAG & DROP)
   ========================================== */
let packedTaros = Array(6).fill(null); // Array of 6 slots
const correctPackingPattern = ['large', 'medium', 'small', 'medium', 'large', 'xlarge'];

function initBakingSimulator() {
    const slots = document.querySelectorAll('.slot');
    const basketItems = document.querySelectorAll('.taro-card');
    
    // Setup drag event listeners on items
    basketItems.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.addEventListener('dragstart', handleDragStart);
    });
    
    // Setup drop slot listeners
    slots.forEach(slot => {
        slot.removeEventListener('dragover', handleDragOver);
        slot.addEventListener('dragover', handleDragOver);
        
        slot.removeEventListener('dragleave', handleDragLeave);
        slot.addEventListener('dragleave', handleDragLeave);
        
        slot.removeEventListener('drop', handleDrop);
        slot.addEventListener('drop', handleDrop);
        
        // Add click listener as mobile fallback
        slot.removeEventListener('click', handleSlotClick);
        slot.addEventListener('click', handleSlotClick);
    });
    
    resetBakingGame();
}

let activeDraggedItemType = null;
let activeDraggedItemId = null;

function handleDragStart(e) {
    activeDraggedItemType = this.getAttribute('data-type');
    activeDraggedItemId = this.getAttribute('id');
    e.dataTransfer.setData('text/plain', activeDraggedItemType);
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const pos = parseInt(this.getAttribute('data-pos'));
    placeTaroInSlot(pos, activeDraggedItemType, activeDraggedItemId);
}

// Mobile-friendly click selection fallback
let selectedBasketTaroType = null;
let selectedBasketTaroId = null;

// Hook up basket item click events for mobile
function setupMobileBasketClicks() {
    document.querySelectorAll('.taro-card').forEach(item => {
        item.removeEventListener('click', handleBasketItemClick);
        item.addEventListener('click', handleBasketItemClick);
    });
}

function handleBasketItemClick() {
    // Toggle active state
    document.querySelectorAll('.taro-card').forEach(c => c.classList.remove('active-select'));
    
    selectedBasketTaroType = this.getAttribute('data-type');
    selectedBasketTaroId = this.getAttribute('id');
    this.classList.add('active-select');
    
    showFeedback("請點擊左側虛擬窯體中的虛擬插槽，將選擇的芋頭放入該位置。");
}

function handleSlotClick() {
    if (selectedBasketTaroType) {
        const pos = parseInt(this.getAttribute('data-pos'));
        placeTaroInSlot(pos, selectedBasketTaroType, selectedBasketTaroId);
        
        // Reset selection
        selectedBasketTaroType = null;
        selectedBasketTaroId = null;
        document.querySelectorAll('.taro-card').forEach(c => c.classList.remove('active-select'));
    }
}

function placeTaroInSlot(pos, type, id) {
    if (!type) return;
    
    // Record slot item
    packedTaros[pos] = type;
    
    // Visual update of the slot
    const slot = document.getElementById(`slot-${pos}`);
    slot.innerHTML = ''; // Clear hint text
    
    // Create avatar inside slot
    const avatar = document.createElement('div');
    avatar.className = `taro-avatar size-${type === 'xlarge' ? 'xl' : type === 'large' ? 'l' : type === 'medium' ? 'm' : 's'}`;
    
    // Translate text label
    const labelMap = { 'small': '小芋頭', 'medium': '中芋頭', 'large': '大芋頭', 'xlarge': '特大芋' };
    avatar.textContent = labelMap[type];
    slot.appendChild(avatar);
    
    // Hide card from tray
    const originalCard = document.getElementById(id);
    if (originalCard) {
        originalCard.style.opacity = '0.3';
        originalCard.setAttribute('draggable', 'false');
    }
    
    updateSimulatorStats();
}

function updateSimulatorStats() {
    let taroVolume = 0;
    
    packedTaros.forEach(type => {
        if (type === 'small') taroVolume += 50;
        else if (type === 'medium') taroVolume += 80;
        else if (type === 'large') taroVolume += 100;
        else if (type === 'xlarge') taroVolume += 150;
    });
    
    const maxCapacity = 484500; // in cm³
    const remainingVol = maxCapacity - taroVolume;
    
    document.getElementById('loaded-taro-volume').textContent = `${taroVolume} cm³`;
    document.getElementById('remaining-volume').textContent = `${remainingVol.toLocaleString()} cm³`;
}

function resetBakingGame() {
    packedTaros = Array(6).fill(null);
    
    // Reset slots
    for (let i = 0; i < 6; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const hintText = i === 0 ? '位置 1 (最左側)' : i === 5 ? '位置 6 (最右側)' : `位置 ${i+1}`;
        slot.innerHTML = `<span class="slot-hint">${hintText}</span>`;
    }
    
    // Reset basket cards
    document.querySelectorAll('.taro-card').forEach(card => {
        card.style.opacity = '1';
        card.setAttribute('draggable', 'true');
        card.classList.remove('active-select');
    });
    
    // Turn off fire
    document.getElementById('fire-waves').classList.remove('active');
    
    // Reset feedback
    showFeedback("vuvu 說過：「小芋頭要放在最容易聚熱的位置（中心上方），而體積較大的大芋頭和特大芋頭要放在排氣散熱較慢的兩側邊緣...」");
    
    updateSimulatorStats();
}

function showFeedback(htmlText, type = 'info') {
    const feedbackBox = document.getElementById('game-feedback');
    const icon = feedbackBox.querySelector('.feedback-icon i');
    const title = feedbackBox.querySelector('.feedback-text h4');
    const desc = feedbackBox.querySelector('.feedback-text p');
    
    desc.innerHTML = htmlText;
    
    if (type === 'success') {
        feedbackBox.style.border = '1px solid rgba(16, 185, 129, 0.4)';
        feedbackBox.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
        feedbackBox.querySelector('.feedback-icon').style.color = 'var(--success)';
        icon.className = 'fa-solid fa-circle-check';
        title.textContent = 'Baking 成功！';
    } else if (type === 'error') {
        feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.4)';
        feedbackBox.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
        feedbackBox.querySelector('.feedback-icon').style.color = 'var(--error)';
        icon.className = 'fa-solid fa-circle-xmark';
        title.textContent = 'Baking 失敗！';
    } else {
        feedbackBox.style.border = '1px solid rgba(245, 158, 11, 0.2)';
        feedbackBox.style.backgroundColor = 'rgba(245, 158, 11, 0.03)';
        feedbackBox.querySelector('.feedback-icon').style.color = 'var(--accent-gold)';
        icon.className = 'fa-solid fa-lightbulb';
        title.textContent = '排列提示：';
    }
}

function startBakingGame() {
    // Check if slots are filled
    const unfilledIndex = packedTaros.findIndex(item => item === null);
    if (unfilledIndex !== -1) {
        showFeedback("你還沒有把所有的芋頭放進窯內喔！請先把籃子裡的芋頭都拖放到合適的插槽位置。", "error");
        return;
    }
    
    // Turn on fire waves animation
    document.getElementById('fire-waves').classList.add('active');
    
    // Analyze pattern
    let isCorrect = true;
    for (let i = 0; i < 6; i++) {
        if (packedTaros[i] !== correctPackingPattern[i]) {
            isCorrect = false;
            break;
        }
    }
    
    setTimeout(() => {
        if (isCorrect) {
            showFeedback("<strong>vuvu 點頭微笑！</strong> 烤窯內形成了完美的對流熱循環！<br>最密實的大芋頭與特大芋頭擺在排熱慢的兩側邊緣，得以慢火長烘；而易熟的小芋頭與中芋頭放在中央排氣散熱最快的位置，熟成得剛剛好，香氣四溢！你完成了最棒的烤芋烘培！<br><strong>增加 100 小米烤芋積分！</strong>", "success");
            triggerScoreEffect(100);
            updatePlayerBadge(100);
        } else {
            // Give specific diagnostics based on layout mistakes
            if (packedTaros[2] === 'xlarge' || packedTaros[3] === 'xlarge') {
                showFeedback("<strong>烤焦了！</strong> 特大芋頭含有大量水分，你把它放到了熱度集中的中央，結果外面都焦黑了，內部依然是生的。大芋頭和特大芋頭應該放在需要長烘的邊緣兩側位置才對！", "error");
            } else if (packedTaros[0] === 'small' || packedTaros[5] === 'small') {
                showFeedback("<strong>小芋頭變成焦炭了！</strong> 最邊緣的烘烤火候是針對大芋頭設計的慢火烘烤，小芋頭體積太小（只有 50 cm³），放在邊角被烘烤太久，水分完全被抽乾烤焦了。小芋頭應該放在正中央熱度流通快的位置！", "error");
            } else {
                showFeedback("<strong>火候不均勻！</strong> 窯內部分芋頭還沒熟，部分已經開始烤焦了。請注意：大顆、需要長烘的芋頭應該靠邊緣放置；小顆、水分多、易熟的應放於對流快速的中間位置。請再試著調整一下排列順序吧！", "error");
            }
        }
    }, 1500);
}

/* ==========================================
   QUIZ CHALLENGE SYSTEM
   ========================================== */
let currentQuestionIndex = 0;
let quizScore = 0;
let questionsData = [
    {
        text: "已知某個傳統石板燒芋窯的側面是一個梯形，量測出來的上底為 60 公分，下底為 110 公分，高為 190 公分。請問這個側面的面積是多少平方公分？",
        options: [
            "16,150 平方公分",
            "32,300 平方公分",
            "11,400 平方公分",
            "8,075 平方公分"
        ],
        answerIdx: 0,
        explanation: "正確答案是 16,150 平方公分。根據梯形面積公式：(上底 + 下底) × 高 ÷ 2，計算為：(60 + 110) × 190 ÷ 2 = 170 × 190 ÷ 2 = 16,150 平方公分。這代表烤窯側面所需的石板總表面積！",
        diagramType: "trapezoid"
    },
    {
        text: "若將一座現代水泥烤芋窯簡化為一個長方體，長為 235 公分，寬為 110 公分，高為 110 公分。請問此簡化窯體的體積是多少立方公分？",
        options: [
            "258,500 立方公分",
            "2,843,500 立方公分",
            "2,585,000 立方公分",
            "127,600 立方公分"
        ],
        answerIdx: 1,
        explanation: "正確答案是 2,843,500 立方公分。長方體體積公式 = 長 × 寬 × 高。計算為：235 × 110 × 110 = 2,843,500 立方公分。換算成生活大單位則約為 2.84 立方公尺！",
        diagramType: "cube"
    },
    {
        text: "接續上題，烤芋窯內部放芋頭的柱狀空間，其底面面積為 16,150 平方公分，深度為 30 公分。請問此烤芋空間的容積是多少公升？(提示：1公升 = 1000立方公分)",
        options: [
            "4,845 公升",
            "48.45 公升",
            "484.5 公升",
            "484,500 公升"
        ],
        answerIdx: 2,
        explanation: "正確答案是 484.5 公升。直角柱容積 = 底面積 × 高(深)。計算為：16,150 × 30 = 484,500 立方公分。因為 1,000 立方公分 = 1 公升，所以 484,500 ÷ 1,000 = 484.5 公升。這代表可放約 484.5 公升體積的芋頭！",
        diagramType: "prism"
    },
    {
        text: "若此放芋內部容積空間為 484,500 立方公分，我們放入了 200 顆大芋頭（每顆 100 立方公分）以及 300 顆中芋頭（每顆 80 立方公分）進去烘烤。請問窯內還剩下多少立方公分的容積空間？",
        options: [
            "440,500 立方公分",
            "44,000 立方公分",
            "460,500 立方公分",
            "420,500 立方公分"
        ],
        answerIdx: 0,
        explanation: "正確答案是 440,500 立方公分。首先計算放入的芋頭總體積：(200 × 100) + (300 × 80) = 20,000 + 24,000 = 44,000 立方公分。剩餘空間 = 容積 - 芋頭總體積，即 484,500 - 44,000 = 440,500 立方公分！",
        diagramType: "none"
    },
    {
        text: "五年級小組想要在學校用厚紙板做一個 1/10 的縮小版燒芋窯模型。原本窯體實體的長為 230 公分，寬為 110 公分。在 1/10 縮小圖上，模型窯體的長與寬應該各為多少公分？",
        options: [
            "長 2.3 公分，寬 1.1 公分",
            "長 23 公分，寬 22 公分",
            "長 230 公分，寬 110 公分",
            "長 23 公分，寬 11 公分"
        ],
        answerIdx: 3,
        explanation: "正確答案是 長 23 公分，寬 11 公分。縮小 1/10 意味著對應邊長均縮小為原本的 1/10 倍。計算為：長 230 ÷ 10 = 23 公分，寬 110 ÷ 10 = 11 公分。模型就是長 23 公分、寬 11 公分的長方形！",
        diagramType: "scale"
    }
];

function startQuiz() {
    document.getElementById('quiz-intro').style.display = 'none';
    document.getElementById('quiz-question-area').style.display = 'block';
    document.getElementById('quiz-result-area').style.display = 'none';
    currentQuestionIndex = 0;
    quizScore = 0;
    showQuestion();
}

function showQuestion() {
    const qData = questionsData[currentQuestionIndex];
    
    // Update progress bar
    const progressPercent = (currentQuestionIndex / questionsData.length) * 100;
    document.getElementById('quiz-progress').style.style = `width: ${progressPercent}%;`;
    document.getElementById('quiz-progress').style.width = `${progressPercent}%`;
    
    document.getElementById('question-num').textContent = `挑戰問題 ${currentQuestionIndex + 1} / ${questionsData.length}`;
    document.getElementById('question-text').textContent = qData.text;
    
    // Render diagram if any
    const canvasContainer = document.getElementById('question-diagram-container');
    if (qData.diagramType !== 'none') {
        canvasContainer.style.display = 'flex';
        drawQuizDiagram(qData.diagramType);
    } else {
        canvasContainer.style.display = 'none';
    }
    
    // Hide feedback
    document.getElementById('quiz-answer-feedback').style.display = 'none';
    
    // Render options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    qData.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerHTML = `<span style="color:var(--accent-orange);margin-right:8px;">${String.fromCharCode(65 + idx)}.</span> ${optText}`;
        btn.onclick = () => selectOption(idx);
        container.appendChild(btn);
    });
}

function drawQuizDiagram(type) {
    const canvas = document.getElementById('question-diagram');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 120;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.font = '12px Outfit, sans-serif';
    
    if (type === 'trapezoid') {
        // Draw trapezoid
        ctx.beginPath();
        ctx.moveTo(100, 20); // Top left
        ctx.lineTo(200, 20); // Top right
        ctx.lineTo(240, 90); // Bottom right
        ctx.lineTo(60, 90);  // Bottom left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw height dash line
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(100, 20);
        ctx.lineTo(100, 90);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = '#f8fafc';
        ctx.fillText("上底: 60 cm", 120, 15);
        ctx.fillText("下底: 110 cm", 120, 110);
        ctx.fillText("高: 190 cm", 110, 60);
    } else if (type === 'cube') {
        // Simple 3D box projection
        ctx.beginPath();
        // front face
        ctx.rect(50, 40, 140, 60);
        ctx.fill();
        ctx.stroke();
        
        // back lines
        ctx.beginPath();
        ctx.moveTo(50, 40); ctx.lineTo(90, 15);
        ctx.lineTo(230, 15); ctx.lineTo(190, 40);
        ctx.moveTo(230, 15); ctx.lineTo(230, 75);
        ctx.lineTo(190, 100);
        ctx.stroke();
        
        // labels
        ctx.fillStyle = '#f8fafc';
        ctx.fillText("長: 235 cm", 100, 115);
        ctx.fillText("高: 110 cm", 10, 75);
        ctx.fillText("寬: 110 cm", 205, 50);
    } else if (type === 'prism') {
        // Draw standard prism
        ctx.beginPath();
        ctx.moveTo(80, 20); ctx.lineTo(140, 20);
        ctx.lineTo(160, 70); ctx.lineTo(60, 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(80, 50); ctx.lineTo(140, 50);
        ctx.lineTo(160, 100); ctx.lineTo(60, 100);
        ctx.closePath();
        ctx.stroke();
        
        // Vertical connecting lines
        ctx.beginPath();
        ctx.moveTo(80, 20); ctx.lineTo(80, 50);
        ctx.moveTo(140, 20); ctx.lineTo(140, 50);
        ctx.moveTo(160, 70); ctx.lineTo(160, 100);
        ctx.moveTo(60, 70); ctx.lineTo(60, 100);
        ctx.stroke();
        
        ctx.fillStyle = '#f8fafc';
        ctx.fillText("底面積: 16150 cm²", 170, 45);
        ctx.fillText("深度: 30 cm", 170, 75);
    } else if (type === 'scale') {
        // Draw side-by-side scaled shapes
        // Big shape
        ctx.strokeRect(40, 30, 80, 50);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(40, 30, 80, 50);
        
        // Small shape
        ctx.strokeRect(180, 45, 40, 25);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.fillRect(180, 45, 40, 25);
        
        ctx.fillStyle = '#f8fafc';
        ctx.fillText("長: 230 cm", 50, 25);
        ctx.fillText("寬: 110 cm", 10, 60);
        ctx.fillText("模型 (1/10 縮小)", 160, 95);
        ctx.fillText("對應縮放邊長?", 180, 35);
    }
}

function selectOption(optIdx) {
    const qData = questionsData[currentQuestionIndex];
    const options = document.querySelectorAll('.quiz-option');
    
    // Disable all options clicks
    options.forEach(btn => btn.onclick = null);
    
    const feedbackBox = document.getElementById('quiz-answer-feedback');
    const statusText = document.getElementById('feedback-status-text');
    const explanationText = document.getElementById('feedback-explanation-text');
    
    feedbackBox.style.display = 'block';
    
    if (optIdx === qData.answerIdx) {
        // Correct
        options[optIdx].classList.add('correct');
        feedbackBox.className = 'quiz-feedback-box correct-feedback';
        statusText.innerHTML = '<i class="fa-solid fa-circle-check"></i> 回答正確！';
        quizScore += 20;
        triggerScoreEffect(20);
    } else {
        // Wrong
        options[optIdx].classList.add('wrong');
        options[qData.answerIdx].classList.add('correct'); // Show correct answer
        feedbackBox.className = 'quiz-feedback-box wrong-feedback';
        statusText.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> 回答錯誤！';
    }
    
    explanationText.textContent = qData.explanation;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionsData.length) {
        showQuestion();
    } else {
        showQuizResult();
    }
}

function showQuizResult() {
    document.getElementById('quiz-question-area').style.display = 'none';
    document.getElementById('quiz-result-area').style.display = 'block';
    
    // Fill progress to 100%
    document.getElementById('quiz-progress').style.style = `width: 100%;`;
    document.getElementById('quiz-progress').style.width = `100%`;
    
    document.getElementById('quiz-score-val').textContent = quizScore;
    
    // Evaluation message
    const evalText = document.getElementById('evaluation-text');
    if (quizScore === 100) {
        evalText.innerHTML = "🎉 <strong>完美挑戰！</strong> 你是真正的「部落大建築師」，對於燒芋窯的幾何特徵與數學公式熟稔無比！";
        updatePlayerBadge(quizScore);
    } else if (quizScore >= 80) {
        evalText.innerHTML = "👍 <strong>太棒了！</strong> 你擁有豐富的數學幾何觀念，已經掌握了部落烤芋頭的精隨！";
        updatePlayerBadge(quizScore);
    } else if (quizScore >= 60) {
        evalText.innerHTML = "😀 <strong>及格通過！</strong> 你已初步理解燒芋窯的數學結構，多加練習可以更上一層樓！";
        updatePlayerBadge(quizScore);
    } else {
        evalText.innerHTML = "🧐 <strong>再接再厲！</strong> 沒關係，建議重新閱讀「文化故事」，或是動手多搭建幾次「虛擬積木」，相信下一次會考得更好！";
    }
}

function restartQuiz() {
    startQuiz();
}

/* ==========================================
   SCORE & BADGE SYSTEM
   ========================================== */
let totalScore = 0;

function triggerScoreEffect(amt) {
    totalScore += amt;
    
    // Animate score counter
    const scoreVal = document.getElementById('total-score');
    let curr = parseInt(scoreVal.textContent);
    const step = Math.ceil(amt / 10);
    
    const interval = setInterval(() => {
        curr += step;
        if (curr >= totalScore) {
            curr = totalScore;
            clearInterval(interval);
        }
        scoreVal.textContent = curr;
    }, 40);
}

function updatePlayerBadge(amt) {
    const badge = document.getElementById('player-badge');
    const text = document.getElementById('badge-text');
    
    if (totalScore >= 200) {
        text.textContent = "部落大建築師 ❖";
        badge.style.background = 'rgba(245, 158, 11, 0.2)';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        badge.style.color = 'var(--accent-gold)';
    } else if (totalScore >= 100) {
        text.textContent = "烤芋小達人 ❖";
        badge.style.background = 'rgba(16, 185, 129, 0.2)';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        badge.style.color = 'var(--success)';
    } else {
        text.textContent = "部落實習生 ❖";
    }
}

/* ==========================================
   INITIALIZATION & BOOTSTRAP
   ========================================== */
window.addEventListener('load', () => {
    // Show first tab by default
    switchTab('culture');
    
    // Setup Drag and Drop events
    initBakingSimulator();
    
    // Setup Mobile fallbacks
    setupMobileBasketClicks();
});
