/* app.js */
const i18n = {
    ko: {
        "nav-core": "ZiewCore 소개",
        "nav-about": "회사 소개",
        "nav-solutions": "솔루션",
        "nav-technology": "기술력",
        "nav-try": "🚀 체험 시뮬레이션",
        "nav-contact": "문의하기",
        "hero-title": "ZiewCore:<br><span class=\"highlight\">Alive and Evolving</span>",
        "hero-subtitle": "'살아있고 진화한다'는 의미로, ZiewCore의 진보적인 자가 학습(Self-learning) 인프라 특성을 직관적으로 보여줍니다.",
        "hero-bottom-tagline": "Edge MLOps OS · 자가학습 인프라 · 1개의 중앙 뇌가 6개의 도메인 전문 AI를 오케스트레이션",
        "hf-1": "엣지 추론 지연시간",
        "hf-2": "도메인 특화 AI 솔루션",
        "hf-3": "자가 학습 · 무중단 배포",
        "hf-4": "엔터프라이즈 가용성",
        "hero-scroll": "스크롤하여 더 보기",
        "about-title": "Who We Are",
        "about-subtitle": "기업 환경에 최적화된 차세대 IT & AI 솔루션 제공자",
        "about-desc": "지와이즈(Ziewise)는 기존의 인프라, 보안, 운영 노하우를 바탕으로, 이제 최첨단 <strong>Edge MLOps OS (ZiewCore)</strong>를 통해 기업의 디지털 전환을 가속화합니다.<br>가상 PC, 스마트 CCTV, 프린트 보안 등 탄탄한 IT 인프라 솔루션 역량을 AI 기술과 결합하여 한 차원 높은 비즈니스 인텔리전스를 제공합니다.",
        "badge-iso": "ISO 27001 인증",
        "badge-venture": "벤처기업 인증",
        "badge-rnd": "기업부설연구소",
        "sol-title": "6대 핵심 비즈니스 쇼케이스",
        "sol-subtitle": "비즈니스 도메인별로 특화된 AI 플러그인이 어떻게 작동하는지 체험해 보세요.",
        "sol-hint": "💡 카드 위에 마우스를 올리면 시뮬레이션이 작동합니다.",
        "zieview-sub": "Smart Vision AI",
        "zieview-diff": "✓ 실시간 엣지 분석 및 모호 데이터 자가 재학습",
        "zieview-raw": "모호한 데이터",
        "zieview-trained": "재학습 완료",
        "neuro-sub": "AI Grid & Energy",
        "neuro-diff": "✓ 분산 에너지 자원의 실시간 연결 및 블록체인 기반 무결성 검증",
        "neuro-verify": "0x1C7... Verified",
        "mpulse-sub": "D2C Commerce AI",
        "mpulse-diff": "✓ 초개인화 AR 분석 및 고객 행동 기반 실시간 전환율 최적화",
        "mpulse-pop-title": "이탈 감지!",
        "mpulse-pop-desc": "🔥 10% 추가 할인 쿠폰 발급",
        "sigming-sub": "Smart Office AI",
        "sigming-diff": "✓ 심층 딥러닝 규정 검토 및 ERP 자동 전표화로 팩트체크 자동화",
        "sigming-receipt-1": "[식대] 구내식당 - 8,000원",
        "sigming-receipt-2": "[심야택시] 카카오T - 45,000원",
        "sigming-erp-label": "> 자동 전표 생성 중...",
        "ziewprint-sub": "Smart Print Security AI",
        "ziewprint-diff": "✓ 제조사명/모델 상관없이 전용 1-드라이버 출력 & 기존 프린터 교체 없는 스마트 보안, 워터마크/출력승인/통계 지원 (AI 장애 대화 지원)",
        "ziewprint-driver": "Universal Driver",
        "ziewprint-auth": "QR/PIN 인증",
        "ziewprint-watermark": "CONFIDENTIAL",
        "ziewprint-stats": "출력 승인 완료 | 실시간 추적 중",
        "ziewprint-chat": "장애 감지: 토너 5% 미만.<br>해결 방안 안내.",
        "observer-sub": "APM & NPM Insights",
        "observer-diff": "✓ 애플리케이션 및 네트워크 통합 3D 토폴로지 분석 및 사전 장애 감지",
        "obs-cpu": "CPU Load",
        "obs-net": "NET Traffic",
        "obs-lat": "Latency",
        "obs-anomaly": "Anomaly Detected",
        "form-company": "업체명",
        "form-name": "성명",
        "form-title": "직급",
        "form-email": "이메일 주소",
        "form-message": "문의내용을 입력해주세요.",
        "btn-send": "문의하기 (이메일 폼 전송)",
        "tech-title": "Core Technology 증명",
        "tech-desc": "Ziewise만의 시스템 구조적 우수성과 효율성",
        "tech-1-title": "능동적 스캐너",
        "tech-1-sub": "Active Learning Selective Collection",
        "tech-1-desc": "모든 데이터를 서버로 전송하지 않습니다. Edge 단에서 <strong>'모호한 데이터(Yellow Point)'만을 선별 수집</strong>하여 네트워크 트래픽과 클라우드 비용을 혁신적으로 절감합니다.",
        "tech-2-title": "무중단 핫스왑",
        "tech-2-sub": "Zero-Downtime Hot-Swap Architecture",
        "tech-2-desc": "AI 모델 업데이트 시 발생하는 다운타임을 원천 차단합니다. <strong>마이크로서비스 아키텍처(MSA)를 통해 실시간으로 신규 모델이 기존 모델을 대체</strong>하여 서비스의 연속성을 보장합니다.",
        "tech-2-old": "Legacy AI Model",
        "tech-2-new": "Optimized AI Model",
        "foot-1": "지와이즈 주식회사 | 대표이사 : 이승현 | 사업자등록번호: 392-87-02849",
        "foot-2": "서울특별시 금천구 가산디지털2로 165 백상스타타워2차 1206호",
        "foot-title": "Contact Us",
        "foot-copy": "Copyright (c) Since 2024 ZIEWISE. All rights reserved.",
        "sigming-live-text": " | 식대 | 8,000 | 승인"
    },
    en: {
        "nav-core": "About ZiewCore",
        "nav-about": "About",
        "nav-solutions": "Solutions",
        "nav-technology": "Technology",
        "nav-try": "🚀 Simulation",
        "nav-contact": "Contact",
        "hero-title": "ZiewCore:<br><span class=\"highlight\">Alive and Evolving</span>",
        "hero-subtitle": "Signifying a living, evolving system, intuitively capturing ZiewCore's proactive self-learning infrastructure capabilities.",
        "hero-bottom-tagline": "Edge MLOps OS · Self-Learning Infrastructure · 6 Domain-Specialist AIs Orchestrated by One Central Brain",
        "hf-1": "Edge Inference Latency",
        "hf-2": "Domain-Specific AI Solutions",
        "hf-3": "Self-Learning · Zero-Downtime Deploy",
        "hf-4": "Enterprise Availability",
        "hero-scroll": "Scroll to explore",
        "about-title": "Who We Are",
        "about-subtitle": "Next-Generation IT & AI Solution Provider Optimized for Enterprise Environments",
        "about-desc": "Based on existing IT infrastructure, security, and operation know-how, Ziewise accelerates digital transformation of enterprises through the cutting-edge <strong>Edge MLOps OS (ZiewCore)</strong>.<br>We provide a higher level of business intelligence by combining AI technology with solid IT infrastructure solutions such as Virtual PC, Smart CCTV, and Print Security.",
        "badge-iso": "ISO 27001 Certified",
        "badge-venture": "Venture Certified",
        "badge-rnd": "R&D Center",
        "sol-title": "6 Core Business Showcases",
        "sol-subtitle": "Experience how domain-specific AI plugins work.",
        "sol-hint": "💡 Hover over the cards to activate simulations.",
        "zieview-sub": "Smart Vision AI",
        "zieview-diff": "✓ Real-time edge analysis and self-retraining of ambiguous data",
        "zieview-raw": "Ambiguous Data",
        "zieview-trained": "Retraining Complete",
        "neuro-sub": "AI Grid & Energy",
        "neuro-diff": "✓ Real-time connection of distributed energy resources and blockchain-based integrity validation",
        "neuro-verify": "0x1C7... Verified",
        "mpulse-sub": "D2C Commerce AI",
        "mpulse-diff": "✓ Hyper-personalized AR analysis and real-time conversion rate optimization based on customer behavior",
        "mpulse-pop-title": "Exit Intent Detected!",
        "mpulse-pop-desc": "🔥 10% Extra Discount Coupon Issued",
        "sigming-sub": "Smart Office AI",
        "sigming-diff": "✓ Fact-checking automation via deep learning regulation review and auto ERP vouchering",
        "sigming-receipt-1": "[Food] Cafeteria - $8.00",
        "sigming-receipt-2": "[Late Night Taxi] Uber - $45.00",
        "sigming-erp-label": "> Auto vouchering in progress...",
        "ziewprint-sub": "Smart Print Security AI",
        "ziewprint-diff": "✓ Universal 1-Driver independent of vendor/model & smart security without printer replacement, supporting watermarks, approval, and stats (AI troubleshooting chat)",
        "ziewprint-driver": "Universal Driver",
        "ziewprint-auth": "QR / PIN Login",
        "ziewprint-watermark": "CONFIDENTIAL",
        "ziewprint-stats": "Print Approved | Tracking Event",
        "ziewprint-chat": "Error: Toner < 5%.<br>Guiding solution...",
        "observer-sub": "APM & NPM Insights",
        "observer-diff": "✓ Integrated APM & NPM 3D topology analysis and predictive fault detection",
        "obs-cpu": "CPU Load",
        "obs-net": "NET Traffic",
        "obs-lat": "Latency",
        "obs-anomaly": "Anomaly Detected",
        "form-company": "Company Name",
        "form-name": "Your Name",
        "form-title": "Job Title",
        "form-email": "Email Address",
        "form-message": "Please enter your inquiry details here.",
        "btn-send": "Send Message (Email)",
        "tech-title": "Core Technology Proof",
        "tech-desc": "Structural excellence and efficiency unique to Ziewise",
        "tech-1-title": "Active Scanner",
        "tech-1-sub": "Active Learning Selective Collection",
        "tech-1-desc": "We do not send everything to the server. By <strong>selectively collecting only 'ambiguous data (Yellow Points)'</strong> at the Edge, we dramatically reduce network traffic and cloud costs.",
        "tech-2-title": "Zero-Downtime Hot-Swap",
        "tech-2-sub": "Zero-Downtime Hot-Swap Architecture",
        "tech-2-desc": "Fundamentally block downtime during AI model updates. <strong>Real-time replacement of legacy models with new ones via Microservices Architecture (MSA)</strong> ensures service continuity.",
        "tech-2-old": "Legacy AI Model",
        "tech-2-new": "Optimized AI Model",
        "foot-1": "Ziewise Co., Ltd. | CEO: Seunghyun Lee | Business Registration No.: 392-87-02849",
        "foot-2": "Suite 1206, Baeksang Star Tower 2, 165 Gasan digital 2-ro, Geumcheon-gu, Seoul",
        "foot-title": "Contact Us",
        "foot-copy": "Copyright (c) Since 2024 ZIEWISE. All rights reserved.",
        "sigming-live-text": " | Food | $8.00 | Approved",
        'form-sub-ph': 'Select an Inquiry Category',
        'form-sub-1': 'Zieview (Vision AI)',
        'form-sub-2': 'Neuro-VPP (Energy)',
        'form-sub-3': 'ZiewCore M-Pulse (Commerce)',
        'form-sub-4': 'SIGMING (Office AI)',
        'form-sub-5': 'ZiewPrint (Print Security)',
        'form-sub-6': 'ZiewCore Observer (Monitoring)',
        'form-sub-7': 'Other/General Inquiry',
        'qa-1': 'Security Vulnerability Scan (Sec Scan)',
        'qa-2': '100k+ Large Scale Load Test',
        'qa-3': 'Anomaly Traffic Detection',
        'qa-4': 'Zero-Downtime Deployment Approved',
        'badge-pmp': 'PMP Certified',
        'tech-0-title': 'Always-On Automated Validation',
        'tech-3-title': 'Ultra-Lightweight Edge AI Engine',
        'tech-3-sub': 'Ultra-Lightweight Edge AI Engine',
        'tech-3-desc': 'Even on constrained compute environments, our <strong>radically lightweight AI models</strong> deliver fast and accurate real-time inference.',
        'about-desc': 'Based on existing IT infrastructure, security, and operation know-how, Ziewise accelerates digital transformation through the cutting-edge <strong>Edge MLOps OS (ZiewCore)</strong>.<br>We deliver higher-level business intelligence by combining AI with solid IT infrastructure capabilities such as Virtual PC, Smart CCTV, and Print Security.<br><br>Beyond simple model provision, we unify the entire AI lifecycle — <strong>data collection → self-learning → zero-downtime deployment → real-time inference</strong> — into a single OS so customers can focus on <strong>business value creation, not infrastructure burden</strong>.'
    }
};

// ============================================================
// EXTRA DICTIONARY: covers Korean text without data-i18n keys
// Walker translates by trimmed innerHTML or innerText match.
// ============================================================
const extraI18n = {
    // Hero / Cube
    "하나의 OS, 6개의 두뇌": "A Central Brain Trains Six Specialist Brains",
    "중앙 뇌가 6개의 전문 뇌를 학습시킨다": "A Central Brain Trains Six Specialist Brains",
    "ZiewCore가 6대 핵심 AI를 동시 오케스트레이션": "ZiewCore continuously trains & orchestrates six specialist AIs",
    "ZiewCore 중앙 AI가 6대 전문 AI를 지속 훈련·오케스트레이션": "ZiewCore continuously trains & orchestrates six specialist AIs",
    // Value cards
    "한 번의 도입 후, 모델은 운영 중에도 스스로 학습하고 진화합니다. 사람의 손길 없이도 정확도가 매일 향상됩니다.": "After a single deployment, the model continues to learn and evolve during operation. Accuracy improves daily without human intervention.",
    "ISO 27001 인증과 블록체인 기반 무결성 검증으로 금융권·공공기관급 보안 표준을 충족합니다.": "Meets financial and government-grade security standards through ISO 27001 certification and blockchain-based integrity verification.",
    "기업부설연구소에서 매일 새로운 모델 아키텍처를 검증하며, 고객 환경에 맞는 최적화를 지속합니다.": "Our R&D Center validates new model architectures daily and continuously optimizes for each customer's environment.",
    // Timeline
    "지와이즈 설립 · IT 인프라 사업 런칭": "Ziewise founded · IT Infrastructure business launched",
    "기업부설연구소 설립 · 벤처기업 인증": "R&D Center established · Venture certification",
    "ZiewCore Edge MLOps OS Alpha 릴리즈": "ZiewCore Edge MLOps OS Alpha released",
    "6대 AI 솔루션 정식 출시 · 엔터프라이즈 확장": "6 AI solutions officially launched · Enterprise expansion",
    // Section intro (solutions)
    "ZiewCore 위에서 동작하는 각 솔루션은 <strong>하나의 OS, 하나의 운영 체계</strong> 안에서 작동합니다. CCTV 영상, 에너지 IoT 신호, 커머스 트래픽, ERP 전표, 인쇄 작업, 시스템 메트릭까지 — 서로 다른 데이터를 <strong>같은 자가학습 파이프라인</strong>으로 처리하므로 도입 후 운영 부담이 비약적으로 줄어듭니다.": "Every solution running on ZiewCore operates within <strong>one OS, one runtime</strong>. CCTV video, energy IoT signals, commerce traffic, ERP vouchers, print jobs, and system metrics — all heterogeneous data flows through the <strong>same self-learning pipeline</strong>, drastically reducing operational burden after adoption.",
    // Solution list items
    "객체 탐지 · 행동 분석 · 이상 감지 통합": "Object detection · Behavior analysis · Anomaly detection integrated",
    "NPU/GPU 자동 최적화 · 30fps 실시간 추론": "NPU/GPU auto-optimization · 30fps real-time inference",
    "모호 케이스만 클라우드 전송 → 90% 트래픽 절감": "Only ambiguous cases sent to cloud → 90% traffic reduction",
    "태양광·ESS·EV 충전기 통합 오케스트레이션": "Solar · ESS · EV charger unified orchestration",
    "수요 예측 LSTM + 가격 신호 기반 자동 거래": "Demand-forecast LSTM + price-signal-based auto trading",
    "모든 거래 내역 블록체인 해시로 위·변조 차단": "All transactions hash-locked on blockchain to prevent tampering",
    "AR 페이스 트래킹 기반 가상 체험 + 톤 매칭": "AR face-tracking virtual try-on + tone matching",
    "이탈 의도 0.5초 내 감지 · 즉시 리텐션 액션": "Exit intent detected within 0.5s · Instant retention action",
    "A/B 캠페인 자동 생성 · 평균 CVR +18%": "A/B campaigns auto-generated · Average CVR +18%",
    "국세청 OCR + 회사 규정 LLM 이중 검증": "NTS OCR + Company-policy LLM dual verification",
    "ERP/그룹웨어 API 자동 전표화 · 결재 라우팅": "ERP/Groupware API auto-vouchering · Approval routing",
    "월말 정산 8시간 → 12분으로 단축": "Month-end close: 8 hours → 12 minutes",
    "QR/PIN/모바일 인증 · 출력물 워터마크 자동 삽입": "QR/PIN/Mobile auth · Auto watermark insertion",
    "토너·용지 잔량 IoT 모니터링 + 자동 발주": "Toner / paper level IoT monitoring + auto reorder",
    "부서별 출력 비용 자동 정산 리포트": "Per-department print cost auto-reporting",
    "APM·NPM·로그·트레이스 단일 대시보드": "APM · NPM · Logs · Traces unified dashboard",
    "이상 패턴 LSTM 학습 → 평균 7분 전 사전 알람": "Anomaly pattern LSTM → 7-min predictive alerts on average",
    "장애 자동 격리 + 롤백 시나리오 자동 실행": "Auto fault isolation + automated rollback scenarios",
    // Industry section
    "ZiewCore가 적용된 산업별 대표 시나리오": "Industry-specific scenarios where ZiewCore is applied",
    "제조 / Smart Factory": "Manufacturing / Smart Factory",
    "생산 라인 비전 검사, 설비 이상 탐지, 작업자 안전 모니터링을 단일 ZiewCore 노드에서 동시 처리.": "Production-line vision inspection, equipment anomaly detection, and worker-safety monitoring — all processed simultaneously on a single ZiewCore node.",
    "불량률 -42%": "Defect rate -42%",
    "가동률 +18%": "Uptime +18%",
    "에너지 / Smart Grid": "Energy / Smart Grid",
    "분산 발전 자원의 실시간 통합 관제와 수요 예측, 블록체인 기반 P2P 전력 거래 인프라.": "Real-time unified control and demand forecasting of distributed generation, with blockchain-based P2P power-trading infrastructure.",
    "예측 정확도 96%": "Prediction accuracy 96%",
    "거래 지연 0.8s": "Trade latency 0.8s",
    "커머스 / D2C Brand": "Commerce / D2C Brand",
    "고객 행동 패턴 학습으로 이탈 직전 자동 개입, 초개인화 추천, AR 가상 체험 제공.": "Learns customer behavior to intervene right before exit, with hyper-personalized recommendations and AR virtual try-on.",
    "이탈율 -27%": "Exit rate -27%",
    "오피스 / Enterprise": "Office / Enterprise",
    "경비 영수증 검증·전표 자동화, 인쇄 보안, 회의실 점유율 분석까지 전 사무 영역 자동화.": "Expense receipt verification, voucher automation, print security, and meeting-room occupancy analysis — full office automation.",
    "업무시간 -65%": "Work hours -65%",
    "오류 -91%": "Errors -91%",
    "의료 / Healthcare": "Medical / Healthcare",
    "의료 영상 보조 판독, 환자 동선 추적, 의료 IoT 장비 모니터링을 엣지에서 안전하게 처리.": "Medical imaging assistance, patient flow tracking, and medical IoT monitoring — all processed securely at the edge.",
    "판독 +3.2x": "Reads +3.2x",
    "HIPAA 준수": "HIPAA Compliant",
    "공공 / Government": "Public / Government",
    "스마트시티 CCTV 통합, 시민 안전 사전 예측, 행정 문서 자동 분류 및 검증.": "Smart-city CCTV integration, predictive citizen safety, and automated classification and verification of administrative documents.",
    "응답 -60%": "Response -60%",
    "망분리 호환": "Air-Gap Compatible",
    // Simulator descriptions
    "각 솔루션이 실제로 어떻게 작동하는지 인터랙티브 3D로 체험해 보세요": "Experience how each solution actually works through interactive 3D",
    "엣지 디바이스의 카메라가 객체를 실시간 탐지하고, 모호한 케이스만 클라우드로 전송하여 자가 학습합니다. CCTV·생산라인·교통 인프라 어디서나 적용 가능합니다.": "Edge-device cameras detect objects in real time and only ambiguous cases are sent to the cloud for self-learning. Applicable to CCTV, production lines, and traffic infrastructure.",
    "분산된 태양광·ESS·EV 충전 인프라를 하나의 가상 발전소로 통합합니다. 실시간 수요 예측과 블록체인 기반 P2P 전력 거래로 에너지 효율을 극대화합니다.": "Integrates distributed solar, ESS, and EV-charging infrastructure into a single virtual power plant. Maximizes energy efficiency with real-time demand forecasting and blockchain-based P2P power trading.",
    "예측 정확도": "Accuracy",
    "활성 노드": "Active Nodes",
    "거래 지연": "Trade Latency",
    "고객의 행동을 실시간 분석하고, AR로 가상 체험을 제공합니다. 이탈 직전을 0.5초 내에 감지해 자동으로 개인화 쿠폰을 발급, 전환율을 극대화합니다.": "Analyzes customer behavior in real time and provides AR virtual try-on. Detects exit intent within 0.5s and automatically issues personalized coupons to maximize conversion.",
    "CVR 상승": "CVR Lift",
    "이탈율": "Exit Rate",
    "감지 속도": "Detection Speed",
    "경비 영수증을 OCR로 읽고 회사 규정과 LLM으로 이중 검증한 뒤, ERP에 자동 전표화합니다. 월말 정산 8시간 작업이 단 12분으로 단축됩니다.": "Reads expense receipts with OCR, double-checks them against company policy with an LLM, and auto-vouchers in ERP. An 8-hour month-end close shrinks to just 12 minutes.",
    "월말 정산": "Month-End Close",
    "오류율": "Error Rate",
    "검증 정확도": "Verification Accuracy",
    "심야택시": "Late-Night Taxi",
    "구내식당": "Cafeteria",
    "호텔": "Hotel",
    "<span>✓</span> 식대 8,000원 → 승인": "<span>✓</span> Meal $8.00 → Approved",
    "<span>⚠</span> 심야택시 → 규정 검토": "<span>⚠</span> Late-Night Taxi → Policy Review",
    "<span>✓</span> 호텔 120,000원 → 출장 매핑": "<span>✓</span> Hotel $120.00 → Trip Mapping",
    "제조사·모델 무관 1-드라이버로 모든 프린터를 통합 관리합니다. QR/PIN 인증, 워터마크 자동 삽입, 토너 자동 발주까지 인쇄 보안을 완성합니다.": "Manages all printers through a single vendor- and model-agnostic driver. Completes print security with QR/PIN authentication, automatic watermarking, and automated toner reordering.",
    "통합 드라이버": "Unified Driver",
    "인증 출력": "Authenticated Print",
    "토너 발주": "Toner Reorder",
    "🔋 토너 8% · 자동 발주 완료": "🔋 Toner 8% · Auto-reorder complete",
    "애플리케이션부터 네트워크까지 통합 3D 토폴로지로 시각화합니다. LSTM 학습으로 평균 7분 전 사전 알람, 장애를 자동 격리하고 롤백합니다.": "Visualizes everything from applications to networks in unified 3D topology. LSTM learning provides 7-minute predictive alerts on average, then auto-isolates and rolls back faults.",
    "사전 알람": "Predictive Alert",
    "롤백": "Rollback",
    // Use cases
    "검증된 산업별 도입 사례": "Proven Industry Adoption Cases",
    "제조부터 금융까지 — ZiewCore는 모든 산업 환경에 적응합니다.": "From manufacturing to finance — ZiewCore adapts to every industry environment.",
    "스마트 팩토리": "Smart Factory",
    "제조 공정 실시간 불량 검출, 작업자 안전 모니터링, 설비 고장 사전 예측까지 통합 운영.": "Integrated operations covering real-time defect detection, worker safety monitoring, and predictive equipment-failure detection.",
    "에너지 · 발전소": "Energy · Power Plant",
    "분산 에너지 자원의 실시간 통합 운영, 수요 예측 기반 자동 거래 및 무결성 검증.": "Real-time integrated operation of distributed energy resources, demand-forecast-based auto trading, and integrity verification.",
    "리테일 · 커머스": "Retail · Commerce",
    "AR 가상 체험, 이탈 의도 즉시 감지, 초개인화 추천으로 평균 전환율 18% 향상.": "AR virtual try-on, instant exit-intent detection, and hyper-personalized recommendations lift conversion by 18% on average.",
    "금융 · 공공기관": "Finance · Public Sector",
    "ISO 27001 보안 표준, 블록체인 기반 감사 추적, 무중단 모델 배포로 컴플라이언스 충족.": "ISO 27001 security standards, blockchain-based audit trails, and zero-downtime model deployment ensure compliance.",
    "의료 · 헬스케어": "Medical · Healthcare",
    "의료 영상 보조 분석, 환자 동선 모니터링, 병원 인쇄물 보안과 자동 발주 통합.": "Medical imaging assistance, patient flow monitoring, and integrated hospital print security with auto-reordering.",
    "스마트 오피스": "Smart Office",
    "경비 처리 자동화, 인쇄 보안, 회의실 점유 분석, 전사 시스템 무중단 모니터링.": "Expense automation, print security, meeting-room occupancy analysis, and zero-downtime enterprise system monitoring.",
    // Tech section intro
    "ZiewCore의 핵심은 <strong>\"한 번 배포 후 스스로 진화한다\"</strong>는 단 한 가지 원칙입니다. 엣지에서 데이터를 선별 수집하고, 자동으로 검증·재학습한 뒤, 무중단으로 모델을 교체합니다. 이 모든 과정은 운영자의 개입 없이 24/7 진행됩니다.": "ZiewCore's core principle is simple: <strong>\"Deploy once, then evolve on its own.\"</strong> Data is selectively collected at the edge, automatically validated and retrained, then models are swapped with zero downtime — all 24/7 without operator intervention.",
    // Process steps
    "엣지에서 모호 데이터만 선별 수집": "Selectively collect only ambiguous data at the edge",
    "자가 라벨링 + 분산 재학습": "Self-labeling + distributed retraining",
    "10만+ 시뮬레이션 자동 검증": "100K+ simulations auto-validation",
    "무중단 모델 핫스왑 배포": "Zero-downtime model hot-swap deployment",
    "엣지 실시간 추론 (45ms)": "Edge real-time inference (45ms)",
    // Tech card descriptions
    "모든 AI 모델과 엔진은 배포 전 수만 건의 <strong>시뮬레이션 및 부하 테스트를 자동으로 통과</strong>해야만 실운영 환경에 적용됩니다.": "Every AI model and engine must <strong>automatically pass tens of thousands of simulations and load tests</strong> before being deployed to production.",
    "모든 데이터를 서버로 전송하지 않습니다. Edge 단에서 <strong>'모호한 데이터(Yellow Point)'만을 선별 수집</strong>하여 네트워크 트래픽과 클라우드 비용을 혁신적으로 절감합니다.": "We do not send everything to the server. By <strong>selectively collecting only 'ambiguous data (Yellow Points)'</strong> at the edge, we drastically cut network traffic and cloud costs.",
    "AI 모델 업데이트 시 발생하는 다운타임을 원천 차단합니다. <strong>마이크로서비스 아키텍처(MSA)를 통해 실시간으로 신규 모델이 기존 모델을 대체</strong>하여 서비스의 연속성을 보장합니다.": "Eliminates downtime during AI model updates at the source. <strong>Microservices Architecture (MSA) replaces legacy models with new ones in real time</strong>, ensuring service continuity.",
    "제한된 컴퓨팅 환경에서도 원활하게 동작하도록 <strong>AI 모델을 혁신적으로 경량화</strong>하여, 빠르고 정확한 실시간 추론(Inference)을 가능하게 합니다.": "Even on constrained compute environments, our <strong>radically lightweight AI models</strong> deliver fast and accurate real-time inference.",
    // Performance dashboard
    "실제 운영 환경에서 측정된 ZiewCore 성능 지표": "ZiewCore performance metrics measured in real production environments",
    "▲ 업계 평균 대비 6.2배 빠름": "▲ 6.2× faster than industry average",
    "1.2GB → 45MB · 정확도 유지 99.4%": "1.2 GB → 45 MB · 99.4% accuracy preserved",
    "MSA 기반 무중단 모델 교체": "MSA-based zero-downtime model swap",
    "Active Learning 선별 수집": "Active Learning selective collection",
    "배포 전 자동 시뮬레이션 횟수": "Pre-deployment auto-simulation count",
    "연간 다운타임 8.7시간 미만": "Annual downtime under 8.7 hours",
    // Form select option (Korean fallback)
    "기타 문의 (Other)": "Other / General Inquiry"
};

function normalizeKey(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
}

// Capture the original Korean innerHTML of every translatable element
// EXACTLY ONCE, at page load, BEFORE any language switching happens.
// This prevents the flaky-toggle bug where late snapshots could capture
// already-translated English text and break later restores.
let __koreanSnapshotted = false;
function snapshotKoreanContent() {
    if (__koreanSnapshotted) return;
    const candidates = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, li, span, div, button, option, a'
    );
    candidates.forEach((el) => {
        if (el.hasAttribute('data-i18n')) return;
        if (el.id === 'btn-ko' || el.id === 'btn-en') return;
        const hasBlockChild = Array.from(el.children).some((c) =>
            /^(DIV|P|UL|OL|LI|H[1-6]|SECTION|ARTICLE|HEADER|FOOTER|NAV|TABLE|FORM|IFRAME|IMG|VIDEO|CANVAS|SVG)$/i.test(c.tagName)
        );
        if (hasBlockChild) return;
        const original = el.innerHTML;
        if (!/[\uAC00-\uD7AF]/.test(original)) return;
        el.dataset.kOrig = original;
    });
    __koreanSnapshotted = true;
}

function applyExtraTranslations(lang) {
    // Make sure we have a clean Korean snapshot to restore from.
    if (!__koreanSnapshotted) snapshotKoreanContent();

    const candidates = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, li, span, div, button, option, a'
    );
    candidates.forEach((el) => {
        if (el.hasAttribute('data-i18n')) return;
        if (el.id === 'btn-ko' || el.id === 'btn-en') return;
        // NEVER rewrite anything inside the top nav — we'd destroy the
        // anchor elements and lose their .active-nav class on every toggle.
        if (el.closest && el.closest('.nav-links')) return;
        const hasBlockChild = Array.from(el.children).some((c) =>
            /^(DIV|P|UL|OL|LI|H[1-6]|SECTION|ARTICLE|HEADER|FOOTER|NAV|TABLE|FORM|IFRAME|IMG|VIDEO|CANVAS|SVG)$/i.test(c.tagName)
        );
        if (hasBlockChild) return;
        // Also skip any element that contains an <a> child — rewriting its
        // innerHTML would regenerate the anchor and strip runtime classes
        // (like .active-nav) added by the SPA logic.
        if (el.querySelector && el.querySelector('a')) return;
        // Only operate on elements we snapshotted (i.e. that originally had Korean).
        if (!el.dataset.kOrig) return;

        const original = el.dataset.kOrig;
        if (lang === 'ko') {
            if (el.innerHTML !== original) el.innerHTML = original;
        } else {
            const trimmed = normalizeKey(original);
            if (extraI18n[trimmed]) {
                el.innerHTML = extraI18n[trimmed];
            } else {
                // Fallback: try replacing each known phrase substring
                let updated = original;
                for (const k in extraI18n) {
                    if (updated.indexOf(k) !== -1) {
                        updated = updated.split(k).join(extraI18n[k]);
                    }
                }
                el.innerHTML = updated;
            }
        }
    });
}

let currentLang = 'ko';

// ============================================================
// NAV MAP — single source of truth for nav text in either language
// ============================================================
const NAV_TEXT_MAP = {
    ko: {
        '#hero':        'ZiewCore 소개',
        '#about':       '회사 소개',
        '#solutions':   '솔루션',
        '#technology':  '기술력',
        '#contact':     '문의하기',
        'try':          '🚀 체험 시뮬레이션'
    },
    en: {
        '#hero':        'About ZiewCore',
        '#about':       'About',
        '#solutions':   'Solutions',
        '#technology':  'Technology',
        '#contact':     'Contact',
        'try':          '🚀 Simulation'
    }
};

function forceWriteNav(lang) {
    const map = NAV_TEXT_MAP[lang];
    if (!map) return;
    document.querySelectorAll('.nav-links a').forEach((a) => {
        if (a.id === 'nav-try') { a.textContent = map.try; return; }
        const href = a.getAttribute('href');
        if (map[href]) a.textContent = map[href];
    });
}

function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    // (1) FIRST — write nav text directly using textContent. This runs
    // before everything else so the user always sees the new menu
    // language even if a later step throws.
    forceWriteNav(lang);

    // Toggle active classes on buttons
    try {
        document.getElementById('btn-ko').classList.toggle('active', lang === 'ko');
        document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    } catch (e) {}

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang] && i18n[lang][key] != null) {
            el.innerHTML = i18n[lang][key];
        }
    });

    // (2) Re-write nav AGAIN after the data-i18n loop in case the loop
    // was the one that wrote the wrong language for any reason.
    forceWriteNav(lang);

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[lang][key]) {
            el.setAttribute('placeholder', i18n[lang][key]);
        }
    });

    // Update dynamic SIGMING text if currently visible
    const typingElement = document.getElementById('erp-typing');
    if (typingElement && typingElement.textContent !== "") {
        const today = new Date().toISOString().split('T')[0];
        typingElement.textContent = `${today}${i18n[currentLang]['sigming-live-text']}`;
    }

    // Apply extra dictionary translations to non-data-i18n Korean text
    try { applyExtraTranslations(lang); } catch (e) { console.warn('extra i18n failed', e); }
}

// ============================================================
// Auto-detect language by visitor IP country
//   - Korea (KR) → Korean (default)
//   - All other countries → English
//   - Manual user choice (KO/EN button) is remembered and overrides
//     auto-detection on subsequent visits
// ============================================================
// Once the user clicks KO/EN, lock out any in-flight auto-detect responses.
let __userLangLocked = false;

function autoDetectLanguage() {
    // 1) If user has previously chosen manually, respect that
    try {
        const saved = localStorage.getItem('ziewise_lang');
        if (saved === 'ko' || saved === 'en') {
            __userLangLocked = true;
            setLanguage(saved);
            return;
        }
    } catch (e) { /* ignore */ }

    // 2) Try IP geolocation via free APIs (try multiple as fallback)
    const apis = [
        { url: 'https://api.country.is/', field: 'country' },
        { url: 'https://ipapi.co/json/',    field: 'country_code' },
        { url: 'https://ipwho.is/',         field: 'country_code' }
    ];

    // Helper: re-check localStorage before applying any auto-detected
    // language, so a user click during the in-flight fetch is never
    // overridden by the late response.
    function safeApply(lang) {
        // If the user already clicked KO/EN, never override.
        if (__userLangLocked) return;
        try {
            const saved = localStorage.getItem('ziewise_lang');
            if (saved === 'ko' || saved === 'en') {
                __userLangLocked = true;
                if (saved !== currentLang) setLanguage(saved);
                return;
            }
        } catch (e) {}
        setLanguage(lang);
    }

    let attempted = 0;
    function tryNext() {
        if (attempted >= apis.length) {
            // 3) Final fallback: browser language
            const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
            safeApply(navLang.startsWith('ko') ? 'ko' : 'en');
            return;
        }
        const api = apis[attempted++];
        fetch(api.url, { method: 'GET', cache: 'no-store' })
            .then((r) => r.ok ? r.json() : Promise.reject())
            .then((data) => {
                const country = (data && data[api.field] ? String(data[api.field]) : '').toUpperCase();
                if (!country) return tryNext();
                safeApply(country === 'KR' ? 'ko' : 'en');
            })
            .catch(() => tryNext());
    }
    tryNext();
}

document.addEventListener('DOMContentLoaded', () => {

    // 0. Language Switcher Event Listeners — manual choice is authoritative.
    // We snapshot Korean BEFORE the very first switch so restores always work,
    // and we lock out any in-flight auto-detect so a late IP fetch can't flip
    // the language back.
    function chooseLang(lang) {
        snapshotKoreanContent();
        __userLangLocked = true;
        try { localStorage.setItem('ziewise_lang', lang); } catch (e) {}
        if (currentLang !== lang) setLanguage(lang);
        else { forceWriteNav(lang); }
    }
    document.getElementById('btn-ko').addEventListener('click', () => chooseLang('ko'));
    document.getElementById('btn-en').addEventListener('click', () => chooseLang('en'));

    // ============================================================
    // NAV MUTATION OBSERVER — third safety net.
    // If anything (extension, late async, race, etc.) writes the wrong
    // language into a nav link, immediately rewrite it back.
    // ============================================================
    try {
        const navUl = document.querySelector('.nav-links');
        if (navUl) {
            let rewriting = false;
            const navObserver = new MutationObserver(() => {
                if (rewriting) return;
                const map = NAV_TEXT_MAP[currentLang];
                if (!map) return;
                let needsFix = false;
                navUl.querySelectorAll('a').forEach((a) => {
                    const expected = a.id === 'nav-try'
                        ? map.try
                        : map[a.getAttribute('href')];
                    if (expected && a.textContent.trim() !== expected.trim()) {
                        needsFix = true;
                    }
                });
                if (needsFix) {
                    rewriting = true;
                    forceWriteNav(currentLang);
                    setTimeout(() => { rewriting = false; }, 0);
                }
            });
            navObserver.observe(navUl, {
                subtree: true,
                childList: true,
                characterData: true
            });
        }
    } catch (e) { /* ignore */ }

    // CRITICAL: snapshot the original Korean content BEFORE any language
    // switch can mutate it. This is what makes KO ↔ EN toggling reliable.
    snapshotKoreanContent();

    // Auto-detect on first visit (or apply saved choice)
    autoDetectLanguage();

    // 1. Hyper-Warp smooth scrolling for nav links
    // Creates a visual "warp" overlay, scrolls instantly under the hood, then fades out.
    
    // Create warp overlay in DOM
    const warpOverlay = document.createElement('div');
    warpOverlay.className = 'warp-overlay';
    document.body.appendChild(warpOverlay);
    
    // Create star lines and planets for warp effect
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        // Randomly make some of them "planets" passing by quickly
        if (i % 15 === 0) {
            star.className = 'warp-star planet';
        } else {
            star.className = 'warp-star';
        }
        
        star.style.left = `${50 + (Math.random() - 0.5) * 100}%`;
        star.style.top = `${50 + (Math.random() - 0.5) * 100}%`;
        // Randomize direction and length for 3D depth
        star.style.setProperty('--angle', `${(Math.random() * 360)}deg`);
        star.style.setProperty('--delay', `${Math.random() * 0.4}s`);
        star.style.setProperty('--duration', `${0.4 + Math.random() * 0.6}s`);
        
        // Randomly add a blueish or yellowish tint to some stars
        if (Math.random() > 0.7) {
            star.style.boxShadow = '0 0 10px 2px rgba(240, 195, 48, 0.8), 0 0 20px 5px rgba(255, 255, 255, 0.4)';
        } else if (Math.random() > 0.4) {
             star.style.boxShadow = '0 0 10px 2px rgba(0, 159, 227, 0.8), 0 0 20px 5px rgba(255, 255, 255, 0.4)';
        }

        warpOverlay.appendChild(star);
    }

    // ============================================================
    // SECTION NAVIGATION  +  SCROLL-SPY
    // All sections are visible (CSS forces display:flex). Clicking a
    // nav link smooth-scrolls to its section, and an IntersectionObserver
    // automatically highlights the matching nav item as the user scrolls.
    // ============================================================
    const sections = ['#hero', '#about', '#solutions', '#technology', '#contact'];

    // Helper: set the active nav link by section id (e.g. '#about').
    let __spyLockUntil = 0;
    function setActiveNav(targetId) {
        document.querySelectorAll('.nav-links a').forEach((a) => {
            if (a.id === 'nav-try') return; // skip CTA button
            if (a.getAttribute('href') === targetId) {
                a.classList.add('active-nav');
            } else {
                a.classList.remove('active-nav');
            }
        });
    }

    // Smooth scroll with offset for the fixed navbar
    function getNavOffset() {
        const nav = document.querySelector('.navbar');
        return nav ? nav.getBoundingClientRect().bottom + 12 : 100;
    }
    function smoothScrollTo(targetId) {
        const el = document.querySelector(targetId);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - getNavOffset();
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    // Initial highlight = Hero
    setActiveNav('#hero');

    // Hijack in-page anchor clicks → warp + smooth scroll + lock spy briefly
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#' || !document.querySelector(targetId)) return;
            e.preventDefault();

            // Lock the scroll-spy while we programmatically scroll so it
            // doesn't briefly flash other sections as we pass over them.
            __spyLockUntil = Date.now() + 900;
            setActiveNav(targetId);

            // Blur/bleed-only transition:
            // The warp star-field overlay was doubling up with the global
            // scroll-bleeding blur effect, so we drop the warp overlay and
            // keep only the smooth-scroll + scroll-bleeding blur.
            smoothScrollTo(targetId);
        });
    });

    // Scroll-spy via IntersectionObserver — highlight nav based on which
    // section currently dominates the viewport.
    try {
        const sectionEls = sections
            .map((id) => document.querySelector(id))
            .filter(Boolean);

        const spyObserver = new IntersectionObserver((entries) => {
            if (Date.now() < __spyLockUntil) return; // ignore during programmatic scroll
            // Pick the entry with the largest intersection ratio
            let best = null;
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
                }
            });
            if (best && best.target && best.target.id) {
                setActiveNav('#' + best.target.id);
            }
        }, {
            // Trigger when a section's middle band crosses the viewport center.
            // Top margin pulls down the trigger line so the section is "current"
            // once its content is roughly under the navbar.
            rootMargin: '-40% 0px -55% 0px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
        });
        sectionEls.forEach((el) => spyObserver.observe(el));

        // Fallback: also recompute on plain scroll in case the observer
        // misses an edge case (very tall sections, etc.).
        let lastSpyId = '#hero';
        function scrollSpyFallback() {
            if (Date.now() < __spyLockUntil) return;
            const probe = window.innerHeight * 0.35;
            let current = '#hero';
            for (const el of sectionEls) {
                const r = el.getBoundingClientRect();
                if (r.top <= probe) current = '#' + el.id;
            }
            if (current !== lastSpyId) {
                lastSpyId = current;
                setActiveNav(current);
            }
        }
        window.addEventListener('scroll', scrollSpyFallback, { passive: true });
    } catch (e) { /* ignore */ }

    // 2. Intersection Observer for fade-in animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                // Don't unobserve if we want hover effects to still work cleanly, 
                // but since we only control initial load transform here, it's fine.
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply init styles and observe for cards and hero content
    const animatedElements = document.querySelectorAll('.solution-card, .tech-card, .hero-content');
    animatedElements.forEach((el, index) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.8s ease-out ${index * 0.1}s, transform 0.8s ease-out ${index * 0.1}s`;
        fadeObserver.observe(el);
    });

    // We must ensure that the transition doesn't interfere with hover transforms later.
    // So after the animation completes, we remove the inline transition so the CSS stylesheet takes over.
    setTimeout(() => {
        animatedElements.forEach(el => {
            el.style.transition = ''; 
        });
    }, 2000);

    // 3. Dynamic typing simulation for SIGMING ERP
    const typingElement = document.getElementById('erp-typing');
    const sigmingCard = document.getElementById('card-sigming');
    let hasTyped = false;

    if (sigmingCard && typingElement) {
        sigmingCard.addEventListener('mouseenter', () => {
            if (!hasTyped) {
                // The actual typing effect is handled by CSS steps animation,
                // here we dynamically fill the text so it looks "live".
                const today = new Date().toISOString().split('T')[0];
                typingElement.textContent = `${today}${i18n[currentLang]['sigming-live-text']}`;
                hasTyped = true;
            }
        });

        sigmingCard.addEventListener('mouseleave', () => {
             // Reset so the animation can play again on next hover
             setTimeout(() => {
                 typingElement.textContent = "";
                 hasTyped = false;
             }, 500);
        });
    }

    // Contact Form MailTo Handler
    document.getElementById('contact-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const category = document.getElementById('req-subject').value || "일반 문의";
        const company = document.getElementById('req-company').value;
        const name = document.getElementById('req-name').value;
        const title = document.getElementById('req-title').value;
        const email = document.getElementById('req-email').value;
        const message = document.getElementById('req-message').value;

        const subject = encodeURIComponent(`[Ziewise 문의 - ${category}] ${company} - ${name}`);
        const body = encodeURIComponent(`문의 카테고리/Category: ${category}\n업체명/Company: ${company}\n성명/Name: ${name}\n직급/Title: ${title}\n이메일/Email: ${email}\n\n문의내용:\n${message}`);

        window.location.href = `mailto:info@ziewise.com?subject=${subject}&body=${body}`;
    });
});
