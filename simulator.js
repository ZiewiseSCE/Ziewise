/* ============================================================
   ZiewCore Experience Simulator
   Multi-step interactive popup:
     1) Industry pick
     2) System registration
     3) Training animation (full cyberpunk visuals)
     4) Personalized results dashboard
   ============================================================ */
(function () {
    'use strict';

    // ---------- LANGUAGE HELPERS ----------
    function getLang() {
        return (document.documentElement.lang || 'ko').startsWith('en') ? 'en' : 'ko';
    }
    const T = {
        ko: {
            title: 'ZiewCore 체험 시뮬레이터',
            subtitle: '우리 회사 시스템을 등록하고 AI가 어떻게 학습·예측하는지 직접 확인해보세요',
            step1: '1. 업종 선택',
            step2: '2. 시스템 등록',
            step3: '3. AI 학습 진행',
            step4: '4. 예측 결과',
            step1h: '어떤 업종이신가요?',
            step1s: 'ZiewCore는 업종별 특화 모델을 자동 로드합니다',
            step2h: '어떤 시스템을 연결할까요?',
            step2s: '2개 이상 선택하세요. 선택한 시스템끼리 상호 학습 시너지가 생깁니다',
            step3h: 'ZiewCore가 학습 중입니다',
            step3s: '엣지 디바이스에서 실시간 자가학습 파이프라인 가동',
            step4h: '🎉 학습 완료! 예상 성과',
            step4s: '실제 고객사 평균 기준 시뮬레이션',
            next: '다음 →',
            prev: '← 이전',
            start: '🚀 학습 시작',
            again: '↺ 다시 해보기',
            close: '닫기',
            selected: '선택됨',
            minTwo: '2개 이상 선택하세요',
            selectedCount: (n) => `${n}개 시스템 연결 준비`,
        },
        en: {
            title: 'ZiewCore Experience Simulator',
            subtitle: 'Register your company systems and watch the AI learn and predict in real time',
            step1: '1. Industry',
            step2: '2. Systems',
            step3: '3. Training',
            step4: '4. Results',
            step1h: 'What industry are you in?',
            step1s: 'ZiewCore auto-loads domain-specific models per industry',
            step2h: 'Which systems do you want to connect?',
            step2s: 'Select 2 or more. Synergy emerges across selected systems',
            step3h: 'ZiewCore is training…',
            step3s: 'Self-learning pipeline running on edge runtime',
            step4h: '🎉 Training complete! Expected outcomes',
            step4s: 'Simulated on averaged benchmarks from real deployments',
            next: 'Next →',
            prev: '← Back',
            start: '🚀 Start training',
            again: '↺ Try again',
            close: 'Close',
            selected: 'selected',
            minTwo: 'Select at least 2',
            selectedCount: (n) => `${n} systems ready to connect`,
        },
    };
    function t(k) {
        const lang = getLang();
        const val = T[lang][k];
        return typeof val === 'function' ? val : val;
    }

    // ---------- DATA ----------
    const INDUSTRIES = [
        { id: 'mfg', icon: '🏭', ko: '제조업',       en: 'Manufacturing', ko_d: '공장·설비·품질',       en_d: 'Factory · Equipment · Quality' },
        { id: 'fin', icon: '💳', ko: '금융',         en: 'Finance',       ko_d: '리스크·사기탐지',       en_d: 'Risk · Fraud detection' },
        { id: 'ret', icon: '🛒', ko: '리테일',       en: 'Retail',        ko_d: '수요예측·개인화',       en_d: 'Demand · Personalization' },
        { id: 'enr', icon: '⚡', ko: '에너지',       en: 'Energy',        ko_d: 'VPP·수요반응',          en_d: 'VPP · DR optimization' },
        { id: 'hc',  icon: '🏥', ko: '헬스케어',     en: 'Healthcare',    ko_d: '영상진단·예후분석',     en_d: 'Imaging · Prognosis' },
        { id: 'log', icon: '🚚', ko: '물류·유통',    en: 'Logistics',     ko_d: '경로최적화·적재',       en_d: 'Routing · Load planning' },
    ];

    const SYSTEMS = [
        { id: 'erp',   icon: '📊', ko: 'ERP',        en: 'ERP',         ko_d: '전사자원관리',   en_d: 'Enterprise Resource',  color: '#00f0ff' },
        { id: 'mes',   icon: '🔧', ko: 'MES',        en: 'MES',         ko_d: '제조실행시스템', en_d: 'Mfg. Execution',       color: '#00f0ff' },
        { id: 'scada', icon: '📡', ko: 'SCADA',      en: 'SCADA',       ko_d: '설비 감시제어',  en_d: 'Supervisory Control',  color: '#8a5bff' },
        { id: 'cctv',  icon: '📹', ko: 'CCTV',       en: 'CCTV',        ko_d: '비전 카메라',    en_d: 'Vision Cameras',       color: '#ff2bd6' },
        { id: 'iot',   icon: '🌡️', ko: 'IoT 센서',   en: 'IoT Sensors', ko_d: '온도·진동·전력', en_d: 'Temp · Vibration · Power', color: '#00f0ff' },
        { id: 'crm',   icon: '👥', ko: 'CRM',        en: 'CRM',         ko_d: '고객관계관리',   en_d: 'Customer Relationship', color: '#ff2bd6' },
        { id: 'wms',   icon: '📦', ko: 'WMS',        en: 'WMS',         ko_d: '창고관리',       en_d: 'Warehouse Mgmt',       color: '#8a5bff' },
        { id: 'pos',   icon: '💳', ko: 'POS',        en: 'POS',         ko_d: '판매시점정보',   en_d: 'Point of Sale',        color: '#ff2bd6' },
        { id: 'hrm',   icon: '👤', ko: 'HRM',        en: 'HRM',         ko_d: '인사관리',       en_d: 'Human Resource',       color: '#00f0ff' },
    ];

    // Pre-canned insights per system combination.
    // Each selected system adds metrics + an insight line.
    // Values are slightly randomized per run so it feels alive.
    const INSIGHTS = {
        erp:   { ko: '재고 회전율 +27%, 월마감 자동화로 결산 기간 9일 → 1.8일', en: 'Inventory turnover +27%, automated month-end closing 9d → 1.8d' },
        mes:   { ko: '공정 OEE 78% → 91%, 설비 다운타임 -34%',                  en: 'OEE 78% → 91%, equipment downtime -34%' },
        scada: { ko: '설비 고장 72시간 前 예측 정확도 94.3%, 예방정비 비용 -31%', en: 'Equipment failure predicted 72h early at 94.3% accuracy, maintenance cost -31%' },
        cctv:  { ko: '공정 불량률 -62%, 작업자 안전사고 -78%',                    en: 'Defect rate -62%, worker safety incidents -78%' },
        iot:   { ko: '이상 진동 조기 감지 2.4배 향상, 에너지 소비 -18%',          en: 'Vibration anomaly detection 2.4× earlier, energy -18%' },
        crm:   { ko: '고객 이탈 예측 정확도 91%, 평균 LTV +43%',                  en: 'Churn prediction 91% accurate, avg LTV +43%' },
        wms:   { ko: '피킹 경로 -38%, 재고 정확도 99.7%',                         en: 'Picking routes -38%, inventory accuracy 99.7%' },
        pos:   { ko: '개인화 추천 전환율 +24%, 일일 수요예측 MAPE 4.1%',          en: 'Personalized recommendation CVR +24%, daily forecast MAPE 4.1%' },
        hrm:   { ko: '퇴사 리스크 사전 감지, 채용 매칭 정확도 +37%',              en: 'Attrition risk detected early, hiring match +37%' },
    };

    // Synergy combos — when 2 specific systems picked together, add a bonus line
    const SYNERGIES = [
        { need: ['erp', 'mes'],   ko: '⚡ ERP × MES 시너지: 실시간 원가 추적으로 마진 +11%p',   en: '⚡ ERP × MES synergy: real-time costing, margin +11pp' },
        { need: ['scada', 'iot'], ko: '⚡ SCADA × IoT 시너지: 설비 디지털 트윈 완성도 96%',     en: '⚡ SCADA × IoT synergy: digital twin completeness 96%' },
        { need: ['cctv', 'scada'],ko: '⚡ CCTV × SCADA 시너지: 영상+센서 교차검증으로 오탐 -83%', en: '⚡ CCTV × SCADA synergy: cross-validation reduces false positives -83%' },
        { need: ['crm', 'pos'],   ko: '⚡ CRM × POS 시너지: 매장별 고객 세그먼트 자동 최적화',    en: '⚡ CRM × POS synergy: per-store segment auto-optimization' },
        { need: ['erp', 'wms'],   ko: '⚡ ERP × WMS 시너지: 발주 리드타임 -52%',                  en: '⚡ ERP × WMS synergy: procurement lead time -52%' },
    ];

    // Training log lines — will be typed out during step 3
    function buildLog(systems) {
        const names = systems.map((s) => s.en).join(', ');
        const total = 8 + Math.floor(Math.random() * 12); // 8-19M rows
        return [
            '> Initializing ZiewCore runtime v4.2.1 …',
            `> Detected data sources: ${names}`,
            `> Ingesting historical records: ${total}.${Math.floor(Math.random() * 9)}M rows`,
            '> Feature engineering: 847 features extracted',
            '> Schema alignment across heterogeneous sources ✓',
            '> Model: EdgeTransformer-V2 (12 layers · 4.1B params)',
            '> Epoch 01/50  loss=2.847  acc=0.612',
            '> Epoch 08/50  loss=1.432  acc=0.781',
            '> Epoch 16/50  loss=0.923  acc=0.841',
            '> Epoch 24/50  loss=0.612  acc=0.894',
            '> Epoch 32/50  loss=0.421  acc=0.927',
            '> Epoch 40/50  loss=0.284  acc=0.948',
            '> Epoch 47/50  loss=0.182  acc=0.961',
            '> Cross-validation: AUC = 0.974',
            '> Blockchain integrity hash: 0x7a3f…c921 ✓',
            '> Deploying to edge runtime … 100%',
            '> ✔ Self-learning loop ACTIVATED',
        ];
    }

    // ---------- STATE ----------
    const state = {
        step: 0,
        industry: null,
        systems: [],
        animTimer: null,
        logTimer: null,
    };

    // ---------- DOM ROOT ----------
    const root = document.getElementById('sim-root');
    if (!root) return;

    // Helper: create element
    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    // ---------- OPEN / CLOSE ----------
    function open() {
        state.step = 0;
        state.industry = null;
        state.systems = [];
        root.innerHTML = '';
        root.setAttribute('aria-hidden', 'false');

        const overlay = el('div', 'sim-overlay');
        const modal = el('div', 'sim-modal');
        overlay.appendChild(modal);
        root.appendChild(overlay);

        // Header
        const header = el('div', 'sim-header');
        header.innerHTML = `
            <div class="sim-title-wrap">
                <div class="sim-title-line"></div>
                <h2 class="sim-title">${T[getLang()].title}</h2>
                <p class="sim-sub">${T[getLang()].subtitle}</p>
            </div>
            <button class="sim-close" aria-label="${T[getLang()].close}">×</button>
        `;
        modal.appendChild(header);

        // Progress stepper
        const stepper = el('div', 'sim-stepper');
        ['step1', 'step2', 'step3', 'step4'].forEach((k, i) => {
            const pill = el('div', 'sim-step-pill', `<span class="sim-step-dot"></span>${T[getLang()][k]}`);
            pill.dataset.step = i;
            stepper.appendChild(pill);
        });
        modal.appendChild(stepper);

        // Body
        const body = el('div', 'sim-body');
        modal.appendChild(body);

        // Footer
        const footer = el('div', 'sim-footer');
        footer.innerHTML = `
            <button class="sim-btn sim-prev">${T[getLang()].prev}</button>
            <span class="sim-footer-hint"></span>
            <button class="sim-btn sim-primary sim-next">${T[getLang()].next}</button>
        `;
        modal.appendChild(footer);

        // Wire
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        header.querySelector('.sim-close').addEventListener('click', close);
        footer.querySelector('.sim-prev').addEventListener('click', prevStep);
        footer.querySelector('.sim-next').addEventListener('click', nextStep);
        document.addEventListener('keydown', onEscape);

        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => overlay.classList.add('open'));
        renderStep();
    }

    function close() {
        root.setAttribute('aria-hidden', 'true');
        const overlay = root.querySelector('.sim-overlay');
        if (overlay) overlay.classList.remove('open');
        if (state.animTimer) { cancelAnimationFrame(state.animTimer); state.animTimer = null; }
        if (state.logTimer) { clearTimeout(state.logTimer); state.logTimer = null; }
        setTimeout(() => {
            root.innerHTML = '';
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onEscape);
        }, 280);
    }
    function onEscape(e) { if (e.key === 'Escape') close(); }

    // ---------- NAVIGATION ----------
    function prevStep() {
        if (state.step === 0) return close();
        state.step--;
        renderStep();
    }
    function nextStep() {
        if (state.step === 0 && !state.industry) return;
        if (state.step === 1 && state.systems.length < 2) return;
        if (state.step === 3) { // from result → restart
            open();
            return;
        }
        state.step++;
        renderStep();
        if (state.step === 2) runTraining();
    }

    function updateStepper() {
        const pills = root.querySelectorAll('.sim-step-pill');
        pills.forEach((p, i) => {
            p.classList.toggle('active', i === state.step);
            p.classList.toggle('done', i < state.step);
        });
    }

    function updateFooter() {
        const prev = root.querySelector('.sim-prev');
        const next = root.querySelector('.sim-next');
        const hint = root.querySelector('.sim-footer-hint');
        const L = T[getLang()];
        if (!prev || !next || !hint) return;

        prev.style.visibility = state.step === 0 ? 'hidden' : 'visible';

        if (state.step === 0) {
            next.textContent = L.next;
            next.disabled = !state.industry;
            hint.textContent = state.industry ? '' : '';
        } else if (state.step === 1) {
            next.textContent = L.start;
            next.disabled = state.systems.length < 2;
            hint.textContent = state.systems.length < 2 ? L.minTwo : L.selectedCount(state.systems.length);
        } else if (state.step === 2) {
            next.textContent = L.next;
            next.disabled = true;
            hint.textContent = '';
        } else if (state.step === 3) {
            next.textContent = L.again;
            next.disabled = false;
            hint.textContent = '';
        }
    }

    // ---------- STEP RENDERERS ----------
    function renderStep() {
        updateStepper();
        const body = root.querySelector('.sim-body');
        if (!body) return;
        body.innerHTML = '';
        if (state.step === 0) renderIndustry(body);
        else if (state.step === 1) renderSystems(body);
        else if (state.step === 2) renderTraining(body);
        else if (state.step === 3) renderResults(body);
        updateFooter();
    }

    function renderIndustry(body) {
        const L = T[getLang()];
        body.appendChild(el('h3', 'sim-step-h', L.step1h));
        body.appendChild(el('p', 'sim-step-p', L.step1s));
        const grid = el('div', 'sim-industry-grid');
        INDUSTRIES.forEach((ind) => {
            const card = el('button', 'sim-industry-card');
            card.innerHTML = `
                <div class="sim-ind-icon">${ind.icon}</div>
                <div class="sim-ind-name">${getLang() === 'ko' ? ind.ko : ind.en}</div>
                <div class="sim-ind-desc">${getLang() === 'ko' ? ind.ko_d : ind.en_d}</div>
            `;
            if (state.industry && state.industry.id === ind.id) card.classList.add('active');
            card.addEventListener('click', () => {
                state.industry = ind;
                body.querySelectorAll('.sim-industry-card').forEach((c) => c.classList.remove('active'));
                card.classList.add('active');
                updateFooter();
            });
            grid.appendChild(card);
        });
        body.appendChild(grid);
    }

    function renderSystems(body) {
        const L = T[getLang()];
        body.appendChild(el('h3', 'sim-step-h', L.step2h));
        body.appendChild(el('p', 'sim-step-p', L.step2s));
        const grid = el('div', 'sim-systems-grid');
        SYSTEMS.forEach((sys) => {
            const card = el('button', 'sim-system-card');
            card.style.setProperty('--sys-color', sys.color);
            card.innerHTML = `
                <div class="sim-sys-check">✓</div>
                <div class="sim-sys-icon">${sys.icon}</div>
                <div class="sim-sys-name">${sys.en}</div>
                <div class="sim-sys-desc">${getLang() === 'ko' ? sys.ko_d : sys.en_d}</div>
            `;
            if (state.systems.find((s) => s.id === sys.id)) card.classList.add('active');
            card.addEventListener('click', () => {
                const idx = state.systems.findIndex((s) => s.id === sys.id);
                if (idx >= 0) {
                    state.systems.splice(idx, 1);
                    card.classList.remove('active');
                } else {
                    state.systems.push(sys);
                    card.classList.add('active');
                }
                updateFooter();
            });
            grid.appendChild(card);
        });
        body.appendChild(grid);
    }

    function renderTraining(body) {
        const L = T[getLang()];
        body.appendChild(el('h3', 'sim-step-h', L.step3h));
        body.appendChild(el('p', 'sim-step-p', L.step3s));

        const arena = el('div', 'sim-arena');
        arena.innerHTML = `
            <div class="sim-arena-left">
                <div class="sim-modules" id="sim-modules"></div>
            </div>
            <div class="sim-arena-center">
                <div class="sim-core">
                    <div class="sim-core-ring ring-a"></div>
                    <div class="sim-core-ring ring-b"></div>
                    <div class="sim-core-ring ring-c"></div>
                    <div class="sim-core-orb">
                        <div class="sim-core-pulse"></div>
                        <div class="sim-core-label">ZiewCore</div>
                    </div>
                </div>
                <svg class="sim-wires" id="sim-wires" viewBox="0 0 800 500" preserveAspectRatio="none"></svg>
                <div class="sim-packets" id="sim-packets"></div>
            </div>
            <div class="sim-arena-right">
                <div class="sim-progress">
                    <div class="sim-progress-label">Training</div>
                    <div class="sim-progress-bar"><div class="sim-progress-fill" id="sim-prog-fill"></div></div>
                    <div class="sim-progress-pct" id="sim-prog-pct">0%</div>
                </div>
                <div class="sim-log" id="sim-log"></div>
            </div>
        `;
        body.appendChild(arena);

        // Populate modules on the left
        const modulesEl = arena.querySelector('#sim-modules');
        state.systems.forEach((sys, i) => {
            const m = el('div', 'sim-module');
            m.style.setProperty('--sys-color', sys.color);
            m.style.animationDelay = (i * 0.12) + 's';
            m.innerHTML = `<span class="sim-m-icon">${sys.icon}</span><span class="sim-m-name">${sys.en}</span>`;
            modulesEl.appendChild(m);
        });
    }

    // ---------- TRAINING ANIMATION ----------
    function runTraining() {
        const body = root.querySelector('.sim-body');
        if (!body) return;

        const fill = body.querySelector('#sim-prog-fill');
        const pct = body.querySelector('#sim-prog-pct');
        const logEl = body.querySelector('#sim-log');
        const wiresSvg = body.querySelector('#sim-wires');
        const packetsEl = body.querySelector('#sim-packets');
        const arena = body.querySelector('.sim-arena');

        // Draw curved wires from each module to core
        function drawWires() {
            wiresSvg.innerHTML = '';
            const arenaRect = arena.getBoundingClientRect();
            const coreEl = body.querySelector('.sim-core-orb');
            const coreRect = coreEl.getBoundingClientRect();
            const cx = coreRect.left + coreRect.width / 2 - arenaRect.left;
            const cy = coreRect.top + coreRect.height / 2 - arenaRect.top;
            const vbW = arenaRect.width;
            const vbH = arenaRect.height;
            wiresSvg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);

            const modules = body.querySelectorAll('.sim-module');
            modules.forEach((m, i) => {
                const mr = m.getBoundingClientRect();
                const sx = mr.right - arenaRect.left;
                const sy = mr.top + mr.height / 2 - arenaRect.top;
                const c1x = sx + (cx - sx) * 0.4;
                const c1y = sy;
                const c2x = sx + (cx - sx) * 0.6;
                const c2y = cy;
                const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cx} ${cy}`;
                const color = state.systems[i].color;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', '1.5');
                path.setAttribute('stroke-opacity', '0.55');
                path.setAttribute('stroke-dasharray', '4 4');
                path.classList.add('sim-wire');
                path.id = `sim-wire-${i}`;
                wiresSvg.appendChild(path);
            });
        }

        // Spawn a data packet (glowing dot) that travels along a wire
        function spawnPacket() {
            const modules = body.querySelectorAll('.sim-module');
            if (!modules.length) return;
            const i = Math.floor(Math.random() * modules.length);
            const path = body.querySelector(`#sim-wire-${i}`);
            if (!path) return;
            const color = state.systems[i].color;
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('r', '4');
            dot.setAttribute('fill', color);
            dot.setAttribute('filter', 'url(#sim-glow)');
            wiresSvg.appendChild(dot);

            const totalLen = path.getTotalLength();
            const duration = 900 + Math.random() * 500;
            const start = performance.now();
            function step(now) {
                const t = Math.min(1, (now - start) / duration);
                const p = path.getPointAtLength(t * totalLen);
                dot.setAttribute('cx', p.x);
                dot.setAttribute('cy', p.y);
                dot.setAttribute('opacity', 1 - t * 0.3);
                if (t < 1) requestAnimationFrame(step);
                else { dot.remove(); pulseCore(); }
            }
            requestAnimationFrame(step);
        }

        function pulseCore() {
            const orb = body.querySelector('.sim-core-orb');
            if (!orb) return;
            orb.classList.remove('hit');
            void orb.offsetWidth;
            orb.classList.add('hit');
        }

        // Add SVG glow filter
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <filter id="sim-glow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        wiresSvg.appendChild(defs);

        // Initial wire draw + redraw on resize
        setTimeout(drawWires, 120);
        const onResize = () => drawWires();
        window.addEventListener('resize', onResize);

        // Training progress ~9 seconds total
        const startTime = performance.now();
        const DURATION = 9000;
        let lastPacket = 0;
        function tick(now) {
            const t = Math.min(1, (now - startTime) / DURATION);
            const curPct = Math.floor(t * 100);
            fill.style.width = curPct + '%';
            pct.textContent = curPct + '%';
            if (now - lastPacket > 220) {
                for (let k = 0; k < 2; k++) spawnPacket();
                lastPacket = now;
            }
            if (t < 1) state.animTimer = requestAnimationFrame(tick);
            else {
                window.removeEventListener('resize', onResize);
                setTimeout(() => {
                    if (state.step === 2) { state.step = 3; renderStep(); }
                }, 600);
            }
        }
        state.animTimer = requestAnimationFrame(tick);

        // Stream training log
        const lines = buildLog(state.systems);
        let idx = 0;
        function typeLine() {
            if (idx >= lines.length || state.step !== 2) return;
            const line = el('div', 'sim-log-line', lines[idx]);
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
            idx++;
            const delay = idx < 3 ? 420 : 480 + Math.random() * 300;
            state.logTimer = setTimeout(typeLine, delay);
        }
        typeLine();
    }

    // ---------- RESULTS STEP ----------
    function renderResults(body) {
        const L = T[getLang()];
        const lang = getLang();
        body.appendChild(el('h3', 'sim-step-h', L.step4h));
        body.appendChild(el('p', 'sim-step-p', L.step4s));

        const data = computeMetrics();

        // ===== ROI HERO BLOCK =====
        const hero = el('div', 'sim-roi-hero');
        hero.innerHTML = `
            <div class="sim-roi-left">
                <div class="sim-roi-tag">${lang === 'ko' ? '💰 예상 연간 경제효과' : '💰 Estimated Annual Impact'}</div>
                <div class="sim-roi-amount-wrap">
                    <span class="sim-roi-currency">₩</span>
                    <span class="sim-roi-amount" data-roi-target="${data.annual}">0</span>
                    <span class="sim-roi-unit">${lang === 'ko' ? '백만' : 'M'}</span>
                </div>
                <div class="sim-roi-sub">${lang === 'ko' ? '비용 절감 + 매출 증대 + 리스크 회피 합산' : 'Cost savings + revenue uplift + risk avoidance'}</div>
                <div class="sim-roi-pills">
                    <span class="sim-roi-pill"><i>📉</i>${lang === 'ko' ? '비용' : 'Cost'} <b>-${data.savePct}%</b></span>
                    <span class="sim-roi-pill"><i>📈</i>${lang === 'ko' ? '매출' : 'Revenue'} <b>+${data.revPct}%</b></span>
                    <span class="sim-roi-pill"><i>🛡️</i>${lang === 'ko' ? '리스크' : 'Risk'} <b>-${data.riskPct}%</b></span>
                </div>
            </div>
            <div class="sim-roi-divider"></div>
            <div class="sim-roi-right">
                <div class="sim-roi-payback">
                    <div class="sim-roi-payback-num"><span data-pay-target="${data.payback}">0</span><span class="sim-roi-payback-unit">${lang === 'ko' ? '개월' : 'mo'}</span></div>
                    <div class="sim-roi-payback-label">${lang === 'ko' ? '예상 투자 회수' : 'Payback period'}</div>
                </div>
                <svg class="sim-roi-spark" viewBox="0 0 220 70" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.55"/>
                            <stop offset="100%" stop-color="#00f0ff" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <path class="sim-spark-area" fill="url(#sparkGrad)" d="M0,62 L22,58 L44,52 L66,44 L88,34 L110,26 L132,18 L154,12 L176,8 L198,5 L220,3 L220,70 L0,70 Z"/>
                    <path class="sim-spark-line" fill="none" stroke="#00f0ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M0,62 L22,58 L44,52 L66,44 L88,34 L110,26 L132,18 L154,12 L176,8 L198,5 L220,3"/>
                    <circle class="sim-spark-end" cx="220" cy="3" r="3.5" fill="#fff"/>
                </svg>
                <div class="sim-roi-trend-label">${lang === 'ko' ? '12개월 누적 효과 예측' : '12-month cumulative impact'}</div>
            </div>
        `;
        body.appendChild(hero);

        // ===== METRIC GAUGE CARDS =====
        const metricRow = el('div', 'sim-metric-row enhanced');
        data.cards.forEach((m, i) => {
            const card = el('div', 'sim-metric-card enhanced');
            card.style.setProperty('--m-color', m.color);
            card.style.animationDelay = (i * 0.1) + 's';
            const pct = Math.max(0.05, Math.min(1, m.after / m.max));
            const C = 2 * Math.PI * 42;
            const decimals = (m.suffix === '×' || m.after < 10) ? 1 : 0;
            card.innerHTML = `
                <div class="sim-metric-gauge-wrap">
                    <svg class="sim-metric-gauge" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.07)" stroke-width="7" fill="none"/>
                        <circle class="sim-gauge-fill" cx="50" cy="50" r="42" stroke="${m.color}" stroke-width="7" fill="none"
                                stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"
                                data-gauge-target="${pct}" transform="rotate(-90 50 50)"/>
                    </svg>
                    <div class="sim-metric-icon">${m.icon}</div>
                </div>
                <div class="sim-metric-label">${lang === 'ko' ? m.ko : m.en}</div>
                <div class="sim-metric-value" data-target="${m.after}" data-suffix="${m.suffix}" data-decimals="${decimals}">0${m.suffix}</div>
                <div class="sim-metric-prepost">
                    <span class="sim-prepost-prev">${m.before}${m.suffix}</span>
                    <span class="sim-prepost-arrow">→</span>
                    <span class="sim-prepost-now">${m.after}${m.suffix}</span>
                </div>
            `;
            metricRow.appendChild(card);
        });
        body.appendChild(metricRow);

        // ===== PER-SYSTEM IMPROVEMENT BARS =====
        const insightWrap = el('div', 'sim-insight-wrap');
        insightWrap.appendChild(el('div', 'sim-insight-h', lang === 'ko' ? '🔍 시스템별 개선 효과' : '🔍 Per-system improvements'));

        const sysGrid = el('div', 'sim-sys-result-grid');
        state.systems.forEach((sys, i) => {
            const ins = INSIGHTS[sys.id];
            if (!ins) return;
            const seed = (sys.id.charCodeAt(0) * 11 + state.systems.length * 13 + i * 7);
            const after = 70 + (seed % 28);
            const before = Math.max(20, after - 28 - (seed % 18));
            const delta = after - before;
            const card = el('div', 'sim-sys-result');
            card.style.setProperty('--sys-color', sys.color);
            card.style.animationDelay = (i * 0.08) + 's';
            card.innerHTML = `
                <div class="sim-sys-result-head">
                    <span class="sim-sys-result-icon">${sys.icon}</span>
                    <strong class="sim-sys-result-name">${sys.en}</strong>
                    <span class="sim-sys-result-delta">+${delta}%p</span>
                </div>
                <div class="sim-sys-result-bars">
                    <div class="sim-bar-row">
                        <span class="sim-bar-tag">${lang === 'ko' ? '도입 전' : 'Before'}</span>
                        <div class="sim-bar-track"><div class="sim-bar-fill before" data-bar-target="${before}"></div></div>
                        <span class="sim-bar-num">${before}%</span>
                    </div>
                    <div class="sim-bar-row">
                        <span class="sim-bar-tag">${lang === 'ko' ? '도입 후' : 'After'}</span>
                        <div class="sim-bar-track"><div class="sim-bar-fill after" data-bar-target="${after}"></div></div>
                        <span class="sim-bar-num">${after}%</span>
                    </div>
                </div>
                <div class="sim-sys-result-note">${lang === 'ko' ? ins.ko : ins.en}</div>
            `;
            sysGrid.appendChild(card);
        });
        insightWrap.appendChild(sysGrid);

        // Synergies
        const ids = state.systems.map((s) => s.id);
        const foundSyn = SYNERGIES.filter((s) => s.need.every((n) => ids.includes(n)));
        if (foundSyn.length) {
            insightWrap.appendChild(el('div', 'sim-insight-h syn', lang === 'ko' ? '✨ 시스템 간 시너지' : '✨ Cross-system synergies'));
            const synGrid = el('div', 'sim-syn-grid');
            foundSyn.forEach((s, i) => {
                const line = el('div', 'sim-syn-pill');
                line.style.animationDelay = ((state.systems.length + i) * 0.08) + 's';
                line.innerHTML = lang === 'ko' ? s.ko : s.en;
                synGrid.appendChild(line);
            });
            insightWrap.appendChild(synGrid);
        }
        body.appendChild(insightWrap);

        // Trigger all animations
        requestAnimationFrame(() => {
            animateMetrics(metricRow);
            animateGauges(metricRow);
            animateRoi(hero);
            animateBars(insightWrap);
        });
    }

    function computeMetrics() {
        const n = state.systems.length;
        const seed = n * 7 + (state.industry ? state.industry.id.length : 1);
        const acc = 88 + (seed % 10);
        const downtimePct = 20 + (seed % 25);
        const downtimeBefore = 12.4;
        const downtimeAfter = +(downtimeBefore * (1 - downtimePct / 100)).toFixed(1);
        const saving = 15 + (seed % 20);
        const speedup = 3 + (seed % 5);
        const baseSavingPerSys = 240 + (seed % 18) * 12;
        const annual = baseSavingPerSys * n;
        const payback = Math.max(4, 18 - n * 2 - (seed % 4));
        return {
            cards: [
                { ko: '예측 정확도',   en: 'Prediction Accuracy', before: 74,             after: acc,           suffix: '%',   icon: '🎯', max: 100, color: '#00f0ff' },
                { ko: '설비 다운타임', en: 'Daily Downtime',      before: downtimeBefore, after: downtimeAfter, suffix: 'h',   icon: '⏱️', max: 12.4, color: '#ff2bd6' },
                { ko: '운영 비용',     en: 'Operating Cost',      before: 100,            after: 100 - saving,  suffix: '%',   icon: '💰', max: 100, color: '#8a5bff' },
                { ko: '의사결정 속도', en: 'Decision Speed',      before: 1,              after: speedup,       suffix: '×',   icon: '⚡', max: 8,   color: '#00f0ff' },
            ],
            annual,
            payback,
            savePct: saving,
            revPct: 8 + (seed % 14),
            riskPct: 30 + (seed % 28),
        };
    }

    function animateMetrics(container) {
        container.querySelectorAll('.sim-metric-value').forEach((valEl) => {
            const target = parseFloat(valEl.dataset.target);
            const suffix = valEl.dataset.suffix || '';
            const decimals = parseInt(valEl.dataset.decimals || '0', 10);
            const dur = 1500;
            const start = performance.now();
            function step(now) {
                const t = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - t, 3);
                const cur = (target * eased).toFixed(decimals);
                valEl.textContent = cur + suffix;
                if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
    }

    function animateGauges(container) {
        container.querySelectorAll('.sim-gauge-fill').forEach((c, i) => {
            const C = 2 * Math.PI * 42;
            const target = parseFloat(c.dataset.gaugeTarget);
            const dur = 1700;
            const startDelay = 100 + i * 80;
            setTimeout(() => {
                const start = performance.now();
                function step(now) {
                    const t = Math.min(1, (now - start) / dur);
                    const eased = 1 - Math.pow(1 - t, 4);
                    c.setAttribute('stroke-dashoffset', (C * (1 - target * eased)).toFixed(2));
                    if (t < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }, startDelay);
        });
    }

    function animateRoi(hero) {
        const amt = hero.querySelector('.sim-roi-amount');
        if (amt) {
            const target = parseInt(amt.dataset.roiTarget, 10);
            const dur = 2000;
            const start = performance.now();
            function step(now) {
                const t = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - t, 4);
                const cur = Math.floor(target * eased);
                amt.textContent = cur.toLocaleString();
                if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }
        const pay = hero.querySelector('[data-pay-target]');
        if (pay) {
            const target = parseInt(pay.dataset.payTarget, 10);
            const dur = 1500;
            const start = performance.now();
            function step(now) {
                const t = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - t, 3);
                pay.textContent = Math.floor(target * eased);
                if (t < 1) requestAnimationFrame(step);
                else pay.textContent = target;
            }
            requestAnimationFrame(step);
        }
        // Sparkline draw + endpoint travel
        const line = hero.querySelector('.sim-spark-line');
        const endDot = hero.querySelector('.sim-spark-end');
        if (line) {
            const len = line.getTotalLength();
            line.style.strokeDasharray = len;
            line.style.strokeDashoffset = len;
            line.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.2,.8,.2,1)';
            requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
        }
        const area = hero.querySelector('.sim-spark-area');
        if (area) {
            area.style.opacity = '0';
            area.style.transition = 'opacity 1.6s ease 0.6s';
            requestAnimationFrame(() => { area.style.opacity = '1'; });
        }
        if (endDot) {
            endDot.style.opacity = '0';
            endDot.style.transition = 'opacity 0.4s ease 2s';
            requestAnimationFrame(() => { endDot.style.opacity = '1'; });
        }
    }

    function animateBars(wrap) {
        const bars = wrap.querySelectorAll('.sim-bar-fill');
        bars.forEach((b, i) => {
            const target = parseFloat(b.dataset.barTarget);
            b.style.width = '0%';
            setTimeout(() => { b.style.width = target + '%'; }, 250 + i * 50);
        });
    }

    // ---------- WIRE NAV BUTTON ----------
    function wireNavButton() {
        const btn = document.getElementById('nav-try');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            open();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireNavButton);
    } else {
        wireNavButton();
    }

    // Expose for debugging
    window.ZiewSim = { open, close };
})();
