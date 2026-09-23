/* ============================================================
   ZiewCore Experience Simulator
   Multi-step interactive popup:
     1) Industry pick
     2) System registration
     3) Training pipeline visualization
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
            step4h: '학습 완료! 예상 성과',
            step4s: '실제 고객사 평균 기준 시뮬레이션',
            next: '다음 →',
            prev: '← 이전',
            start: '학습 시작',
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
            step4h: 'Training complete! Expected outcomes',
            step4s: 'Simulated on averaged benchmarks from real deployments',
            next: 'Next →',
            prev: '← Back',
            start: 'Start training',
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
        { id: 'erp',   icon: '📊', ko: 'ERP',        en: 'ERP',         ko_d: '전사자원관리',   en_d: 'Enterprise Resource',  color: '#2763df' },
        { id: 'mes',   icon: '🔧', ko: 'MES',        en: 'MES',         ko_d: '제조실행시스템', en_d: 'Mfg. Execution',       color: '#2763df' },
        { id: 'scada', icon: '📡', ko: 'SCADA',      en: 'SCADA',       ko_d: '설비 감시제어',  en_d: 'Supervisory Control',  color: '#15233b' },
        { id: 'cctv',  icon: '📹', ko: 'CCTV',       en: 'CCTV',        ko_d: '비전 카메라',    en_d: 'Vision Cameras',       color: '#597295' },
        { id: 'iot',   icon: '🌡️', ko: 'IoT 센서',   en: 'IoT Sensors', ko_d: '온도·진동·전력', en_d: 'Temp · Vibration · Power', color: '#2763df' },
        { id: 'crm',   icon: '👥', ko: 'CRM',        en: 'CRM',         ko_d: '고객관계관리',   en_d: 'Customer Relationship', color: '#597295' },
        { id: 'wms',   icon: '📦', ko: 'WMS',        en: 'WMS',         ko_d: '창고관리',       en_d: 'Warehouse Mgmt',       color: '#15233b' },
        { id: 'pos',   icon: '💳', ko: 'POS',        en: 'POS',         ko_d: '판매시점정보',   en_d: 'Point of Sale',        color: '#597295' },
        { id: 'hrm',   icon: '👤', ko: 'HRM',        en: 'HRM',         ko_d: '인사관리',       en_d: 'Human Resource',       color: '#2763df' },
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
        { need: ['erp', 'mes'],   ko: 'ERP × MES 시너지: 실시간 원가 추적으로 마진 +11%p',   en: 'ERP × MES synergy: real-time costing, margin +11pp' },
        { need: ['scada', 'iot'], ko: 'SCADA × IoT 시너지: 설비 디지털 트윈 완성도 96%',     en: 'SCADA × IoT synergy: digital twin completeness 96%' },
        { need: ['cctv', 'scada'],ko: 'CCTV × SCADA 시너지: 영상+센서 교차검증으로 오탐 -83%', en: 'CCTV × SCADA synergy: cross-validation reduces false positives -83%' },
        { need: ['crm', 'pos'],   ko: 'CRM × POS 시너지: 매장별 고객 세그먼트 자동 최적화',    en: 'CRM × POS synergy: per-store segment auto-optimization' },
        { need: ['erp', 'wms'],   ko: 'ERP × WMS 시너지: 발주 리드타임 -52%',                  en: 'ERP × WMS synergy: procurement lead time -52%' },
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
    const root = document.getElementById('sim-root') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'sim-root' }));
    root.setAttribute('aria-hidden', 'true');

    // Helper: create element
    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (tag === 'button') e.type = 'button';
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    // ---------- OPEN / CLOSE AND KEYBOARD ACCESS ----------
    let returnFocus = null;
    let savedOverflow = '';
    let background = [];
    let isOpen = false;
    let trainingRun = 0;
    let digitalTwin = null;
    let twinSession = 0;
    let twinPaused = false;
    let removeTwinMotionListener = null;
    function syncTwin() {
        digitalTwin?.update({industry:state.industry,systems:state.systems,phase:state.step});
        const label=root.querySelector('.sim-twin-context');
        if(label)label.textContent=state.industry?(getLang()==='ko'?state.industry.ko:state.industry.en):(getLang()==='ko'?'업종별 AI 아키텍처':'Industry-aware AI architecture');
        const count=root.querySelector('.sim-twin-count');
        if(count)count.textContent=getLang()==='ko'?`${state.systems.length}개 시스템 선택`:`${state.systems.length} systems selected`;
    }
    function startTwin(host) {
        const session=++twinSession;
        const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
        twinPaused=document.documentElement.classList.contains('motion-paused')||motionPreference.matches;
        import('./simulator3d.js?v=20260924-petrol1').then(({mountSimulation})=>{
            if(!isOpen||session!==twinSession||!host.isConnected)return;
            digitalTwin=mountSimulation(host,{industry:state.industry,systems:state.systems,phase:state.step,reducedMotion:twinPaused});
            digitalTwin.setPaused(twinPaused,{manual:false});syncTwin();
        }).catch(()=>{
            if(host.isConnected)host.textContent=getLang()==='ko'?'시스템을 선택하면 연결 구성을 확인할 수 있습니다.':'Select systems to explore their connections.';
        });
        const button=root.querySelector('.sim-twin-pause');
        const updateButton=()=>{button.setAttribute('aria-pressed',String(twinPaused));button.textContent=getLang()==='ko'?(twinPaused?'모션 재생':'모션 일시정지'):(twinPaused?'Play motion':'Pause motion');};
        button.addEventListener('click',()=>{twinPaused=!twinPaused;digitalTwin?.setPaused(twinPaused);updateButton();});
        const motionChanged=event=>{twinPaused=event.matches;digitalTwin?.setPaused(twinPaused,{manual:false});updateButton();};
        motionPreference.addEventListener('change',motionChanged);
        removeTwinMotionListener=()=>motionPreference.removeEventListener('change',motionChanged);
        updateButton();
    }
    function stopTraining() {
        trainingRun++;
        cancelAnimationFrame(state.animTimer);
        clearTimeout(state.logTimer);
        state.animTimer = null;
        state.logTimer = null;
    }
    function lockBackground() {
        background = [];
        let branch = root;
        while (branch.parentElement && branch !== document.body) {
            Array.from(branch.parentElement.children).forEach((sibling) => {
                if (sibling === branch || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) return;
                background.push([sibling, sibling.inert]);
                sibling.inert = true;
            });
            branch = branch.parentElement;
        }
    }
    function open() {
        stopTraining();
        removeTwinMotionListener?.();removeTwinMotionListener=null;
        digitalTwin?.dispose();digitalTwin=null;twinSession++;
        if (!isOpen) {
            returnFocus = document.activeElement;
            savedOverflow = document.body.style.overflow;
            lockBackground();
        }
        isOpen = true;
        state.step = 0;
        state.industry = null;
        state.systems = [];
        root.innerHTML = '';
        root.setAttribute('aria-hidden', 'false');
        const L = T[getLang()];
        const overlay = el('div', 'sim-overlay open');
        const modal = el('div', 'sim-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'sim-title');
        modal.setAttribute('aria-describedby', 'sim-subtitle');
        modal.tabIndex = -1;
        overlay.appendChild(modal);
        root.appendChild(overlay);
        const header = el('div', 'sim-header', `
            <div class="sim-title-wrap">
                <span class="sim-eyebrow">ZIEWCORE / EXPERIENCE</span>
                <h2 class="sim-title" id="sim-title">${L.title}</h2>
                <p class="sim-sub" id="sim-subtitle">${L.subtitle}</p>
            </div>
            <button type="button" class="sim-close" aria-label="${L.close}">×</button>`);
        modal.appendChild(header);
        const stepper = el('ol', 'sim-stepper');
        ['step1', 'step2', 'step3', 'step4'].forEach((key, index) => {
            const pill = el('li', 'sim-step-pill', `<span class="sim-step-dot" aria-hidden="true"></span>${L[key]}`);
            pill.dataset.step = index;
            stepper.appendChild(pill);
        });
        modal.appendChild(stepper);
        const layout=el('div','sim-layout');
        const panel=el('div','sim-3d-panel',`
            <div class="sim-twin-heading"><span>ZIEWCORE / CONNECTED INTELLIGENCE</span><strong class="sim-twin-context"></strong></div>
            <div class="sim-digital-twin" role="img" aria-label="${getLang()==='ko'?'선택한 시스템과 AI 코어의 3D 연결 구조':'3D connections between selected systems and the AI core'}"></div>
            <div class="sim-twin-bottom"><span class="sim-twin-count"></span><button type="button" class="sim-twin-pause"></button></div>
            <p class="sim-twin-note">${getLang()==='ko'?'선택한 시스템과 학습 단계가 3D 구조에 반영됩니다.':'The 3D structure reflects your systems and learning stage.'}</p>`);
        layout.appendChild(panel);layout.appendChild(el('div','sim-body'));modal.appendChild(layout);
        const footer = el('div', 'sim-footer', `
            <button type="button" class="sim-btn sim-prev">${L.prev}</button>
            <span class="sim-footer-hint" role="status" aria-live="polite"></span>
            <button type="button" class="sim-btn sim-primary sim-next">${L.next}</button>`);
        modal.appendChild(footer);
        overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
        header.querySelector('.sim-close').addEventListener('click', close);
        footer.querySelector('.sim-prev').addEventListener('click', prevStep);
        footer.querySelector('.sim-next').addEventListener('click', nextStep);
        document.addEventListener('keydown', onDialogKey);
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('dialog-open');
        window.dispatchEvent(new CustomEvent('ziewise:dialog',{detail:true}));
        renderStep();
        startTwin(panel.querySelector('.sim-digital-twin'));
    }
    function close() {
        if (!isOpen) return;
        stopTraining();
        removeTwinMotionListener?.();removeTwinMotionListener=null;
        digitalTwin?.dispose();digitalTwin=null;twinSession++;
        isOpen = false;
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = '';
        document.body.style.overflow = savedOverflow;
        document.documentElement.classList.remove('dialog-open');
        window.dispatchEvent(new CustomEvent('ziewise:dialog',{detail:false}));
        document.removeEventListener('keydown', onDialogKey);
        background.forEach(([element, inert]) => { element.inert = inert; });
        background = [];
        if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    }
    function onDialogKey(event) {
        if (event.key === 'Escape') { event.preventDefault(); close(); return; }
        if (event.key !== 'Tab') return;
        const modal = root.querySelector('.sim-modal');
        if (!modal) return;
        const focusable = Array.from(modal.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'))
            .filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
            event.preventDefault(); first.focus();
        }
    }

    // ---------- NAVIGATION ----------
    function prevStep() {
        if (state.step === 0) return close();
        stopTraining();
        // Results return to the retained system selection for another run.
        state.step = state.step === 3 ? 1 : state.step - 1;
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
            if (i === state.step) p.setAttribute('aria-current', 'step');
            else p.removeAttribute('aria-current');
        });
    }

    function updateFooter() {
        syncTwin();
        const prev = root.querySelector('.sim-prev');
        const next = root.querySelector('.sim-next');
        const hint = root.querySelector('.sim-footer-hint');
        const L = T[getLang()];
        if (!prev || !next || !hint) return;

        prev.style.visibility = state.step === 0 ? 'hidden' : 'visible';
        prev.disabled = state.step === 0;

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
        body.scrollTop = 0;
        const layout=root.querySelector('.sim-layout');if(layout)layout.scrollTop=0;
        const heading = body.querySelector('.sim-step-h');
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }

    function renderIndustry(body) {
        const L = T[getLang()];
        body.appendChild(el('h3', 'sim-step-h', L.step1h));
        body.appendChild(el('p', 'sim-step-p', L.step1s));
        const grid = el('div', 'sim-industry-grid');
        INDUSTRIES.forEach((ind, index) => {
            const card = el('button', 'sim-industry-card');
            card.innerHTML = `
                <div class="sim-ind-icon" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
                <div class="sim-ind-name">${getLang() === 'ko' ? ind.ko : ind.en}</div>
                <div class="sim-ind-desc">${getLang() === 'ko' ? ind.ko_d : ind.en_d}</div>
            `;
            const selected = Boolean(state.industry && state.industry.id === ind.id);
            card.classList.toggle('active', selected);
            card.setAttribute('aria-pressed', String(selected));
            card.addEventListener('click', () => {
                state.industry = ind;
                body.querySelectorAll('.sim-industry-card').forEach((c) => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
                card.classList.add('active');
                card.setAttribute('aria-pressed', 'true');
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
                <div class="sim-sys-check" aria-hidden="true">✓</div>
                <div class="sim-sys-name">${getLang() === 'ko' ? sys.ko : sys.en}</div>
                <div class="sim-sys-desc">${getLang() === 'ko' ? sys.ko_d : sys.en_d}</div>
            `;
            const selected = state.systems.some((s) => s.id === sys.id);
            card.classList.toggle('active', selected);
            card.setAttribute('aria-pressed', String(selected));
            card.addEventListener('click', () => {
                const idx = state.systems.findIndex((s) => s.id === sys.id);
                if (idx >= 0) {
                    state.systems.splice(idx, 1);
                    card.classList.remove('active');
                } else {
                    state.systems.push(sys);
                    card.classList.add('active');
                }
                card.setAttribute('aria-pressed', String(card.classList.contains('active')));
                updateFooter();
            });
            grid.appendChild(card);
        });
        body.appendChild(grid);
    }

    function renderTraining(body) {
        const L = T[getLang()];
        const ko = getLang() === 'ko';
        body.appendChild(el('h3', 'sim-step-h', L.step3h));
        body.appendChild(el('p', 'sim-step-p', L.step3s));
        const arena = el('div', 'sim-arena');
        arena.innerHTML = `
            <div class="sim-pipeline">
                <div class="sim-pipeline-sources"><span class="sim-pipeline-label">${ko ? '연결 시스템' : 'CONNECTED SYSTEMS'}</span><div class="sim-modules"></div></div>
                <span class="sim-pipeline-arrow" aria-hidden="true">→</span>
                <div class="sim-core"><span class="sim-pipeline-label">EDGE RUNTIME</span><strong>ZiewCore</strong><span>${ko ? '학습 · 예측' : 'Learn · Predict'}</span></div>
            </div>
            <div class="sim-progress">
                <div class="sim-progress-top"><span>${ko ? 'AI 학습 진행' : 'Training progress'}</span><span id="sim-prog-pct">0%</span></div>
                <div class="sim-progress-bar" role="progressbar" aria-label="${ko ? 'AI 학습 진행' : 'Training progress'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="sim-progress-fill" id="sim-prog-fill"></div></div>
            </div>
            <div class="sim-log" id="sim-log" role="log" aria-live="off" aria-label="${ko ? '학습 로그' : 'Training log'}"></div>`;
        state.systems.forEach((sys) => arena.querySelector('.sim-modules').appendChild(el('span', 'sim-module', ko ? sys.ko : sys.en)));
        body.appendChild(arena);
    }
    function runTraining() {
        stopTraining();
        const run = trainingRun;
        const body = root.querySelector('.sim-body');
        if (!body) return;
        const fill = body.querySelector('#sim-prog-fill');
        const pct = body.querySelector('#sim-prog-pct');
        const progress = body.querySelector('[role="progressbar"]');
        const log = body.querySelector('#sim-log');
        const lines = buildLog(state.systems);
        const startTime = performance.now();
        const duration = 6500;
        let lineIndex = 0;
        function tick(now) {
            if (!isOpen || state.step !== 2 || run !== trainingRun) return;
            const fraction = Math.min(1, (now - startTime) / duration);
            const value = Math.floor(fraction * 100);
            fill.style.width = value + '%';
            pct.textContent = value + '%';
            progress.setAttribute('aria-valuenow', String(value));
            const visibleLines = Math.min(lines.length, Math.floor(fraction * lines.length) + 1);
            while (lineIndex < visibleLines) {
                const line = el('div', 'sim-log-line');
                line.textContent = lines[lineIndex++];
                log.appendChild(line);
                log.scrollTop = log.scrollHeight;
            }
            if (fraction < 1) state.animTimer = requestAnimationFrame(tick);
            else state.logTimer = setTimeout(() => {
                if (isOpen && state.step === 2 && run === trainingRun) { state.step = 3; renderStep(); }
            }, 450);
        }
        state.animTimer = requestAnimationFrame(tick);
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
                <div class="sim-roi-tag">${lang === 'ko' ? '예상 연간 경제효과' : 'Estimated Annual Impact'}</div>
                <div class="sim-roi-amount-wrap">
                    <span class="sim-roi-currency">₩</span>
                    <span class="sim-roi-amount" data-roi-target="${data.annual}">0</span>
                    <span class="sim-roi-unit">${lang === 'ko' ? '백만' : 'M'}</span>
                </div>
                <div class="sim-roi-sub">${lang === 'ko' ? '비용 절감 + 매출 증대 + 리스크 회피 합산' : 'Cost savings + revenue uplift + risk avoidance'}</div>
                <div class="sim-roi-pills">
                    <span class="sim-roi-pill">${lang === 'ko' ? '비용' : 'Cost'} <b>-${data.savePct}%</b></span>
                    <span class="sim-roi-pill">${lang === 'ko' ? '매출' : 'Revenue'} <b>+${data.revPct}%</b></span>
                    <span class="sim-roi-pill">${lang === 'ko' ? '리스크' : 'Risk'} <b>-${data.riskPct}%</b></span>
                </div>
            </div>
            <div class="sim-roi-divider"></div>
            <div class="sim-roi-right">
                <div class="sim-roi-payback">
                    <div class="sim-roi-payback-num"><span data-pay-target="${data.payback}">0</span><span class="sim-roi-payback-unit">${lang === 'ko' ? '개월' : 'mo'}</span></div>
                    <div class="sim-roi-payback-label">${lang === 'ko' ? '예상 투자 회수' : 'Payback period'}</div>
                </div>
                <svg class="sim-roi-spark" aria-hidden="true" viewBox="0 0 220 70" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stop-color="#2763df" stop-opacity="0.55"/>
                            <stop offset="100%" stop-color="#2763df" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <path class="sim-spark-area" fill="url(#sparkGrad)" d="M0,62 L22,58 L44,52 L66,44 L88,34 L110,26 L132,18 L154,12 L176,8 L198,5 L220,3 L220,70 L0,70 Z"/>
                    <path class="sim-spark-line" fill="none" stroke="#2763df" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M0,62 L22,58 L44,52 L66,44 L88,34 L110,26 L132,18 L154,12 L176,8 L198,5 L220,3"/>
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
                    <svg class="sim-metric-gauge" aria-hidden="true" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="#e2e8f0" stroke-width="7" fill="none"/>
                        <circle class="sim-gauge-fill" cx="50" cy="50" r="42" stroke="${m.color}" stroke-width="7" fill="none"
                                stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"
                                data-gauge-target="${pct}" transform="rotate(-90 50 50)"/>
                    </svg>
                    <div class="sim-metric-icon" aria-hidden="true">${String(i + 1).padStart(2, '0')}</div>
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
        insightWrap.appendChild(el('div', 'sim-insight-h', lang === 'ko' ? '시스템별 개선 효과' : 'Per-system improvements'));

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
            insightWrap.appendChild(el('div', 'sim-insight-h syn', lang === 'ko' ? '시스템 간 시너지' : 'Cross-system synergies'));
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
                { ko: '예측 정확도',   en: 'Prediction Accuracy', before: 74,             after: acc,           suffix: '%',   icon: '🎯', max: 100, color: '#2763df' },
                { ko: '설비 다운타임', en: 'Daily Downtime',      before: downtimeBefore, after: downtimeAfter, suffix: 'h',   icon: '⏱️', max: 12.4, color: '#597295' },
                { ko: '운영 비용',     en: 'Operating Cost',      before: 100,            after: 100 - saving,  suffix: '%',   icon: '💰', max: 100, color: '#15233b' },
                { ko: '의사결정 속도', en: 'Decision Speed',      before: 1,              after: speedup,       suffix: '×',   icon: '⚡', max: 8,   color: '#2763df' },
            ],
            annual,
            payback,
            savePct: saving,
            revPct: 8 + (seed % 14),
            riskPct: 30 + (seed % 28),
        };
    }

    // Show final values immediately; charts remain readable with reduced motion.
    function animateMetrics(container) {
        container.querySelectorAll('[data-target]').forEach((element) => {
            element.textContent = Number(element.dataset.target).toFixed(Number(element.dataset.decimals)) + element.dataset.suffix;
        });
    }
    function animateGauges(container) {
        container.querySelectorAll('[data-gauge-target]').forEach((circle) => {
            circle.setAttribute('stroke-dashoffset', String(2 * Math.PI * 42 * (1 - Number(circle.dataset.gaugeTarget))));
        });
    }
    function animateRoi(hero) {
        hero.querySelector('[data-roi-target]').textContent = Number(hero.querySelector('[data-roi-target]').dataset.roiTarget).toLocaleString();
        hero.querySelector('[data-pay-target]').textContent = hero.querySelector('[data-pay-target]').dataset.payTarget;
    }
    function animateBars(container) {
        container.querySelectorAll('[data-bar-target]').forEach((bar) => { bar.style.width = bar.dataset.barTarget + '%'; });
    }

    // ---------- WIRE NAV BUTTON ----------
    function wireNavButton() {
        const btn = document.getElementById('nav-try');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.focus({ preventScroll: true });
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
