export const homeVoice = {
  "design": {
    "file": "design.mp3",
    "duration": 8,
    "cues": [
      {
        "start": 0.0,
        "end": 3.325,
        "text": "품질 담당자가 가공면에서 낯선 선을 발견합니다."
      },
      {
        "start": 3.485,
        "end": 6.834,
        "text": "정상 무늬인지 흠집인지, 먼저 같은 로트의 기록을 엽니다."
      }
    ]
  },
  "systems": {
    "file": "systems.mp3",
    "duration": 9,
    "cues": [
      {
        "start": 0.0,
        "end": 4.196,
        "text": "MES에서 부품의 로트를 찾고 DCS 압력 추이를 겹칩니다."
      },
      {
        "start": 4.357,
        "end": 8.596,
        "text": "LLM이 정리한 검사 기준에 따라 이 구간의 부품을 다시 봅니다."
      }
    ]
  },
  "vision": {
    "file": "vision.mp3",
    "duration": 9,
    "cues": [
      {
        "start": 0.0,
        "end": 2.69,
        "text": "조명 아래에서 딥러닝이 짚은 위치를 확대합니다."
      },
      {
        "start": 2.85,
        "end": 6.685,
        "text": "담당자는 정상 가공 자국과 흠집 샘플을 나란히 비교합니다."
      }
    ]
  },
  "edge": {
    "file": "edge.mp3",
    "duration": 8,
    "cues": [
      {
        "start": 0.0,
        "end": 2.661,
        "text": "담당자가 의심 부품의 출하를 보류합니다."
      },
      {
        "start": 2.822,
        "end": 7.307,
        "text": "재검 위치와 판정 근거가 로트에 남아 다음 교대조도 결정을 이어갑니다."
      }
    ]
  }
};
