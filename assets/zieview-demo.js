"use strict";

(() => {
  const scenarios = JSON.parse(document.getElementById("film-data").textContent).scenarios;
  const get = name => document.getElementById("event-" + name);
  const consolePanel = get("console");
  const choices = [...document.querySelectorAll('[name="detection-scenario"]')];
  const steps = [...consolePanel.querySelectorAll(".event-track li")];
  const review = get("review");
  const respond = get("respond");
  const train = get("train");
  const restart = get("restart");
  let selected = 0;

  function showStep(step, status, note) {
    steps.forEach((item, i) => {
      if (i === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    get("status").textContent = status;
    get("note").textContent = note;
    review.hidden = step !== 0;
    respond.hidden = train.hidden = step !== 1;
    restart.hidden = step !== 2;
  }
  function select(index) {
    selected = index;
    const [name, , camera, , action] = scenarios[index];
    get("title").textContent = name;
    get("camera").textContent = camera;
    respond.textContent = action;
    showStep(0, "감지 후보 접수", "이 카메라에서 확인할 장면이 들어왔습니다. 발생 전후 상황을 열어 조치를 선택해 보세요.");
  }
  choices.forEach((item, index) => item.addEventListener("toggle", () => {
    if (item.open) select(index);
  }));
  review.addEventListener("click", () => {
    showStep(1, "담당자 확인", scenarios[selected][3]);
    respond.focus({preventScroll: true});
  });
  respond.addEventListener("click", () => {
    showStep(2, "현장 조치 기록", scenarios[selected][4] + " 절차를 선택했습니다. 이 이벤트의 카메라와 담당자가 선택한 조치를 함께 기록합니다.");
    restart.focus({preventScroll: true});
  });
  train.addEventListener("click", () => {
    showStep(2, "AI Trainer · 오탐 검토", scenarios[selected][5] + " 검증된 오탐은 반복 장면 대조와 다음 재학습에 활용합니다.");
    restart.focus({preventScroll: true});
  });
  restart.addEventListener("click", () => {
    select(selected);
    review.focus({preventScroll: true});
  });
  select(0);
  consolePanel.hidden = false;
})();
