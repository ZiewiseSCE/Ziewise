// Timings describe an illustrative learning lifecycle, not real training duration.
export const STORY_DURATION = 72;
export const STORY_CHAPTERS = [
  { start:0, name:['현장 관찰','Observe'], title:['작은 차이에서 시작되는 지능.','Intelligence starts with a small difference.'],
    copy:['검사 카메라가 금속 부품의 표면을 포착합니다. 미세한 흠집도 학습을 위한 데이터가 됩니다.','An inspection camera captures a metal part. Even a fine surface scratch becomes data to learn from.'],
    tag:'01 / THE REAL WORLD', detail:['카메라 · 표면 영상 · 현장 데이터','CAMERA · SURFACE IMAGE · FIELD DATA'] },
  { start:10, name:['특징 추출','Extract'], title:['픽셀에서, 의미 있는 패턴으로.','From pixels to meaningful patterns.'],
    copy:['여러 층의 필터가 윤곽과 질감, 결함의 패턴을 추출합니다. 깊은 층으로 갈수록 판단에 필요한 특징을 조합합니다.','Successive filters extract edges, textures and defect patterns. Deeper layers combine the features needed for a decision.'],
    tag:'02 / FEATURE EXTRACTION', detail:['입력 영상 → 윤곽 → 질감 → 결함 특징','IMAGE → EDGES → TEXTURE → DEFECT FEATURES'] },
  { start:20, name:['반복 학습','Learn'], title:['오차를 되짚으며, 연결을 조정하다.','Trace the error. Refine the connections.'],
    copy:['예측과 정답의 차이를 계산하고, 오차를 거꾸로 전파해 가중치를 조정합니다. 반복 학습으로 패턴을 구별하는 모델을 만듭니다.','Compare predictions with labels, then backpropagate the error to adjust weights. Repeated training builds a model that distinguishes patterns.'],
    tag:'03 / DEEP LEARNING', detail:['순방향 계산 · 오차 역전파 · 가중치 조정','FORWARD PASS · BACKPROPAGATION · WEIGHT UPDATE'] },
  { start:30, name:['모델 검증','Validate'], title:['처음 보는 데이터로, 다시 확인하다.','Prove it on unseen data.'],
    copy:['학습에 쓰지 않은 검증 데이터로 후보 모델을 비교합니다. 정해진 기준을 통과한 모델만 다음 배포 단계로 넘깁니다.','Compare candidate models on held-out validation data. Only a model that meets the defined criteria moves to deployment.'],
    tag:'04 / VALIDATION GATE', detail:['분리된 검증 데이터 · 후보 비교 · 배포 기준','HELD-OUT DATA · MODEL COMPARISON · RELEASE GATE'] },
  { start:40, name:['엣지 배포','Deploy'], title:['학습한 지능을, 현장 가까이.','Bring learned intelligence to the edge.'],
    copy:['검증된 모델을 현장의 엣지 장비에 전달합니다. 현장 데이터는 가까운 장비에서 추론에 사용됩니다.','Deliver the validated model to an edge device. Incoming operational data is processed close to where it is produced.'],
    tag:'05 / EDGE DEPLOYMENT', detail:['검증된 모델 → ZiewCore → 엣지 장비','VALIDATED MODEL → ZIEWCORE → EDGE DEVICE'] },
  { start:50, name:['판단과 환류','Act & improve'], title:['판단은 현장으로. 경험은 다음 학습으로.','Decisions into action. Experience into learning.'],
    copy:['학습한 모델이 흠집을 찾아 검토 알림을 보냅니다. 확인된 현장 피드백은 선별·검증을 거쳐 다음 학습에 반영됩니다.','The trained model flags the scratch for review. Confirmed feedback is selected and checked before entering the next training cycle.'],
    tag:'06 / INFERENCE & FEEDBACK', detail:['결함 후보 탐지 · 검토 알림 · 피드백 선별','DEFECT CANDIDATE · REVIEW ALERT · CURATED FEEDBACK'] },
  { start:60, name:['절감과 ROI','Savings & ROI'], title:['줄어든 반복과 손실. 돌아오는 투자.','Less repetition. Less loss. A measurable return.'],
    copy:['검사 작업시간과 불량 손실의 절감 가능성을 계산합니다. 도입비와 운영비까지 함께 반영해 우리 현장의 투자 회수기간을 살펴보세요.','Estimate the value of reduced inspection work and defect losses. Include implementation and running costs to assess the potential payback for your operation.'],
    tag:'07 / CUSTOMER VALUE', detail:['작업시간 절감 · 불량 손실 감소 · 투자 회수','LESS INSPECTION WORK · LOWER DEFECT LOSSES · PAYBACK'] }
];
export function storyFrame(time) {
  const seconds = ((time % STORY_DURATION) + STORY_DURATION) % STORY_DURATION;
  const chapter = Math.min(6, Math.floor(seconds / 10));
  return { seconds, chapter, progress:(seconds - chapter * 10) / (chapter===6?12:10) };
}
