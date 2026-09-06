/* Deterministic explanation sequences. All displayed events are illustrative. */
(() => {
  "use strict";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const valveSteps = [
    {
      annotationLabel: "연결된 공정 밸브", annotationValue: "4,000+ TAG",
      annotationNote: "압력 데이터 + 과거 정비 이력<br>동일 밸브 기준으로 연결",
      beatLabel: "01 / 현장의 신호를 연결합니다", beatTitle: "따로 보던 압력과 정비 기록을, 하나로.",
      beatText: "설비별 정상 패턴을 학습해 변화의 기준을 만듭니다.", status: "패턴 학습", tone: "normal",
      task1: "밸브별 기록 연결", detail1: "태그 ID로 압력·정비 이력을 함께 확인",
      task2: "평소 상태와 비교", detail2: "일시 변화와 반복되는 이상징후를 구분",
      benefit: "담당자는 <b>기록을 찾는 시간</b>을 줄입니다."
    },
    {
      annotationLabel: "AI가 찾아낸 확인 대상", annotationValue: "P-04XXX · 주의",
      annotationNote: "평소와 다른 압력 패턴 감지<br>과거 정비 이력과 함께 검토",
      beatLabel: "02 / 급등 이전의 변화를 찾습니다", beatTitle: "숫자 하나보다, 달라지는 패턴을 봅니다.",
      beatText: "이상징후가 있는 밸브를 선별하고 판단 근거를 보여줍니다.", status: "이상징후 발견", tone: "warn",
      task1: "확인할 밸브 선별", detail1: "전체 밸브 목록에서 고위험 설비 우선 확인",
      task2: "변화 추이와 정비 이력 검토", detail2: "어느 설비를, 왜 확인해야 하는지 함께 파악",
      benefit: "모든 설비를 뒤지지 않고 <b>이상 밸브부터 확인</b>합니다."
    },
    {
      annotationLabel: "다음 작업으로 연결", annotationValue: "우선 점검 대상",
      annotationNote: "위험도에 따라 점검 순서 결정<br>담당자 현장 점검·수동 조치 예시",
      beatLabel: "03 / 발견을 선제 점검으로 연결합니다", beatTitle: "문제가 커지기 전에, 정비 순서를 정합니다.",
      beatText: "담당자가 위험도와 이력을 확인하고 계획정비에 반영합니다.", status: "점검 계획", tone: "good",
      task1: "고위험 설비 우선 점검", detail1: "현장 상태 확인 후 정비 필요 여부 결정",
      task2: "계획정비 일정에 반영", detail2: "부품·인력을 준비하고 불필요한 교체 최소화",
      benefit: "급한 호출에 쫓기던 일을 <b>준비된 점검</b>으로 바꿉니다."
    },
    {
      annotationLabel: "현장에서 달라지는 일", annotationValue: "긴급 대응 → 계획정비",
      annotationNote: "고위험 설비에 정비 역량 집중<br>출동·교체·비가동 비용 절감",
      beatLabel: "04 / 업무 변화가 비용 효과로 이어집니다", beatTitle: "불필요한 출동은 줄이고, 필요한 정비에 집중.",
      beatText: "수치의 확정은 같은 기간의 도입 전후 운영 로그로 검증합니다.", status: "효과 검증", tone: "good",
      task1: "직접 유지보수비 감소 추정", detail1: "연 1.7~2.4억 · 교체주기와 정비 투입 최적화",
      task2: "출동·비가동 회피 추정", detail2: "연 0.3~0.6억 · 총효익 연 2.0~3.0억 환산",
      benefit: "투자 약 5.5억 기준 <b>단순 회수 22~33개월</b> 추정."
    }
  ];
  const countSteps = [
    {
      beatLabel: "01 / 모든 포장을 검사합니다", beatTitle: "세고, 다시 세던 작업을 AI가 맡습니다.",
      beatText: "품목을 구분하고 목표 수량과 비교합니다. 한 칸은 인식한 부품 한 개입니다.",
      status: "전수검증", tone: "normal", task1: "목표 수량 설정", detail1: "품목별 50개 또는 100개 포장 기준 선택",
      task2: "출하 전 전수검증", detail2: "각 부품을 식별하고 목표와 실제 수량 비교",
      benefit: "작업자는 반복 계수 대신 <b>예외 처리</b>에 집중합니다.",
      countNote: "분류한 부품을 하나씩 인식합니다.", gate: "검증 전 · 출하 대기"
    },
    {
      beatLabel: "02 / 수량이 다르면 출하를 멈춥니다", beatTitle: "단 한 개가 부족해도, 그대로 보내지 않습니다.",
      beatText: "불일치 포장을 선별해 보류하고 작업자에게 부족 수량을 알려줍니다.",
      status: "1개 부족 · 보류", tone: "warn", task1: "수량 불일치 포장 선별", detail1: "목표보다 1개 적음 · 출하 승인하지 않음",
      task2: "작업자에게 확인 요청", detail2: "전체 물량 대신 보류된 포장만 다시 확인",
      benefit: "고객에게 도착하기 전에 <b>오수량 납품을 차단</b>합니다.",
      countNote: "목표보다 1개 부족합니다. 확인이 필요합니다.", gate: "출하 보류 · 수량 불일치"
    },
    {
      beatLabel: "03 / 부족 수량을 보충하고 다시 확인합니다", beatTitle: "예외 포장만 보충하고, AI로 한 번 더.",
      beatText: "담당자가 부족 수량을 보충한 후 동일 기준으로 재검증합니다.",
      status: "재검증 완료", tone: "good", task1: "부족한 부품 1개 보충", detail1: "작업자가 보류 원인을 확인하고 수량 조정",
      task2: "목표 수량 일치 확인", detail2: "재검증 결과가 맞을 때만 출하 승인",
      benefit: "재검할 대상을 좁혀 <b>반복 계수·재포장 부담</b>을 줄입니다.",
      countNote: "보충 후 목표 수량이 일치합니다.", gate: "수량 일치 · 다음 출하 단계"
    },
    {
      beatLabel: "04 / 정확한 포장이 고객 신뢰를 지킵니다", beatTitle: "다시 세는 비용과, 잘못 보내는 손실을 줄입니다.",
      beatText: "직접효익과 오납품 방지 시 손실회피를 구분해 효과를 확인합니다.",
      status: "출하 가능", tone: "good", task1: "계수·재검·재출하 비용 감소", detail1: "7개월 직접효익 0.3~0.5억 · 기존 자료 기준",
      task2: "오납품 1건 방지 효과 가정", detail2: "페널티·라인차질 회피 2.0~2.3억 · 조건부",
      benefit: "7개월 총효익 <b>2.3~2.8억 원</b>의 조건부 시나리오.",
      countNote: "일치한 포장은 출하하고 예외 건에 집중합니다.", gate: "검증 완료 · 출하 가능"
    }
  ];

  function setup(id, steps, boundaries, duration) {
    const root = document.getElementById(id);
    if (!root) return;
    const fields = Object.fromEntries([...root.querySelectorAll("[data-cs]")].map(el => [el.dataset.cs, el]));
    const buttons = [...root.querySelectorAll(".cs-step")];
    const tasks = [...root.querySelectorAll(".cs-task")];
    const isCount = id === "sCOUNT";
    let phase = -1, elapsed = 0, pinned = false, replaying = false, target = 50, cells = [], lastCount = -1;
    let epoch = 0, phaseTime = 0;
    let world = null, worldPromise = null;
    root.classList.toggle("cs-static", reducedMotion);

    function makeCells() {
      if (!isCount) return;
      fields.objects.replaceChildren();
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < target; i++) {
        const cell = document.createElement("span");
        cell.className = "cs-object"; cell.textContent = String(i + 1).padStart(2, "0");
        cell.setAttribute("aria-hidden", "true"); fragment.append(cell);
      }
      fields.objects.append(fragment);
      const line = document.createElement("i"); line.className = "cs-scan-line"; line.setAttribute("aria-hidden", "true"); fields.objects.append(line);
      cells = [...fields.objects.querySelectorAll(".cs-object")];
      fields.objects.classList.toggle("compact", target === 100);
      fields.targetValue.textContent = target;
      fields.gridSummary.textContent = `목표 ${target}개`;
      root.querySelectorAll("[data-target]").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.target) === target)));
      lastCount = -1;
    }

    function drawCount(count) {
      if (!isCount || lastCount === count) return;
      lastCount = count;
      fields.countValue.textContent = count;
      fields.objects.setAttribute("aria-label", `목표 ${target}개 중 ${count}개 인식. ${phase === 1 ? "1개 부족으로 출하 보류" : phase >= 2 && count === target ? "수량 일치, 검증 완료" : "보충·검증 중"}`);
      fields.gridSummary.textContent = `${count}개 인식 / 목표 ${target}개`;
      cells.forEach((cell, i) => {
        cell.classList.toggle("detected", i < count);
        cell.classList.toggle("missing", phase === 1 && i === target - 1);
      });
    }

    function show(next, force = false) {
      if (next === phase && !force) return;
      phase = next;
      epoch++; phaseTime = 0;
      root.dataset.step = String(phase);
      const step = steps[phase];
      Object.entries(step).forEach(([name, value]) => {
        if (!fields[name]) return;
        if (name === "benefit" || name === "annotationNote") fields[name].innerHTML = value;
        else fields[name].textContent = value;
      });
      fields.status.dataset.tone = step.tone;
      buttons.forEach((button, i) => {
        button.setAttribute("aria-pressed", String(i === phase));
        button.style.setProperty("--step-fill", i < phase ? "100%" : "0%");
      });
      tasks.forEach(t => t.classList.toggle("is-done", phase >= 2));
      if (isCount) {
        lastCount = -1;
        drawCount(phase === 0 ? (pinned || reducedMotion ? target - 1 : 0) : phase === 1 || (phase === 2 && !reducedMotion) ? target - 1 : target);
        updateVerification();
      }
    }

    function updateVerification() {
      if (!isCount || phase !== 2) return;
      const complete = reducedMotion || phaseTime >= 1700;
      drawCount(complete ? target : target - 1);
      fields.status.textContent = complete ? '재검증 완료' : '보충·재검증 중';
      fields.status.dataset.tone = complete ? 'good' : 'normal';
      fields.countNote.textContent = complete ? steps[2].countNote : '부족한 1개를 보충하고 다시 확인합니다.';
      fields.gate.textContent = complete ? steps[2].gate : '보충·검증 중 · 게이트 대기';
    }

    buttons.forEach(button => button.addEventListener("click", () => {
      pinned = true;
      show(Number(button.dataset.phase), true);
    }));
    root.querySelector(".cs-replay").addEventListener("click", () => {
      pinned = false; replaying = true; elapsed = 0;
      show(reducedMotion ? 3 : 0, true);
    });
    root.querySelectorAll("[data-target]").forEach(button => button.addEventListener("click", () => {
      target = Number(button.dataset.target);
      makeCells(); elapsed = 0; pinned = false; replaying = true; show(reducedMotion ? 3 : 0, true);
    }));
    root.addEventListener("keydown", event => {
      if (event.target.closest("button") && [" ", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) event.stopPropagation();
    });
    makeCells();

    FX[id] = {
      enter() {
        elapsed = 0; pinned = false; replaying = false; phase = -1;
        show(reducedMotion ? 3 : 0);
        if (!worldPromise) worldPromise = import('./case-world.js?v=20260906-3d-v1').then(module => {
          world = module.createCaseWorld(root, isCount ? 'count' : 'valve');
          world.update({phase, target, epoch, count:lastCount, delta:0, reducedMotion});
        }).catch(error => {
          root.dataset.renderer = 'fallback';
          root.querySelector('.cs-world-state').textContent = '개념 그래픽';
          console.warn('Customer-case 3D unavailable; using the illustrated explanation.', error);
        });
        let last = performance.now();
        T.raf(now => {
          const delta = Math.min(200, Math.max(0, now - last)); last = now;
          root.dataset.motion = playbackPaused ? "paused" : "running";
          if (!playbackPaused) phaseTime += delta;
          updateVerification();
          if (world) world.update({phase, target, epoch, count:lastCount, delta:playbackPaused || reducedMotion ? 0 : delta/1000, reducedMotion});
          if (playbackPaused || pinned || reducedMotion) return;
          elapsed += delta;
          let progress = Math.min(1, elapsed / duration);
          // The audio file is the narration clock. Manual presentation has its own finite sequence.
          if (!replaying && voiceOn && recordedActive && Number.isFinite(recordedNarration.duration) && recordedNarration.duration > 0) {
            progress = Math.min(1, recordedNarration.currentTime / recordedNarration.duration);
          }
          let next = boundaries.findIndex(end => progress < end);
          if (next < 0) next = 3;
          show(next);
          const start = phase === 0 ? 0 : boundaries[phase - 1];
          const segment = Math.min(1, Math.max(0, (progress - start) / (boundaries[phase] - start)));
          buttons[phase].style.setProperty("--step-fill", `${segment * 100}%`);
          if (isCount && phase === 0) drawCount(Math.min(target - 1, Math.floor(segment * (target - 1))));
        });
      },
      leave() { root.dataset.motion = "paused"; }
    };
  }
  setup("sVALVE", valveSteps, [.26, .44, .62, 1], 26000);
  setup("sCOUNT", countSteps, [.10, .18, .27, 1], 29000);
})();
