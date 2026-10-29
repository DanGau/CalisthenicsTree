"""Video -> per-frame MediaPipe Pose world landmarks as JSON. See docs/figure.md (Mocap).

Setup (in app/):  python -m venv .venv-video && .venv-video/Scripts/python -m pip install mediapipe opencv-python
Run:              .venv-video/Scripts/python tools/video/landmarks.py <video> [out.json] [--every n]
Video, model and output live in .video-cache/ (git-ignored). The heavy model is downloaded there once.
Output: {fps, w, h, frames: [{f, t, w: [[x,y,z,vis]*33] | null}]}; world metres, hip-centred, y down.
"""
import json
import sys
import urllib.request
from pathlib import Path

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision

CACHE = Path(__file__).resolve().parents[2] / '.video-cache'
MODEL = CACHE / 'pose_landmarker_heavy.task'
URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task'


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    every = int(sys.argv[sys.argv.index('--every') + 1]) if '--every' in sys.argv else 1
    if '--every' in sys.argv:
        args.remove(str(every))
    src = Path(args[0])
    out = Path(args[1]) if len(args) > 1 else CACHE / f'{src.stem}.json'
    CACHE.mkdir(exist_ok=True)
    if not MODEL.exists():
        urllib.request.urlretrieve(URL, MODEL)
    opts = vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODEL)),
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.3, min_tracking_confidence=0.3)
    cap = cv2.VideoCapture(str(src))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frames = []
    with vision.PoseLandmarker.create_from_options(opts) as det:
        f = 0
        while True:
            ok, img = cap.read()
            if not ok:
                break
            if f % every == 0:
                ms = int(f * 1000 / fps)
                r = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)), ms)
                lm = r.pose_world_landmarks[0] if r.pose_world_landmarks else None
                im = r.pose_landmarks[0] if r.pose_landmarks else None
                frames.append({'f': f, 't': round(ms / 1000, 4),
                               'w': [[round(p.x, 4), round(p.y, 4), round(p.z, 4), round(p.visibility or 0, 3)] for p in lm] if lm else None,
                               'i': [[round(p.x, 4), round(p.y, 4)] for p in im] if im else None})
            f += 1
    out.write_text(json.dumps({'video': src.name, 'fps': fps, 'w': w, 'h': h, 'frames': frames}))
    print(out, len(frames), 'frames', sum(1 for x in frames if x['w']), 'with a pose')


if __name__ == '__main__':
    main()
