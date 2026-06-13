from ultralytics import YOLO

model = YOLO("yolov8n-pose.pt")

THRESHOLD = 20


def check_posture(image_path: str):
    results = model(image_path)
    keypoints = results[0].keypoints.xy[0]

    ear_x = keypoints[3][0]
    shoulder_x = keypoints[5][0]

    offset = ear_x - shoulder_x

    if offset < -THRESHOLD:
        return "bad posture", offset.item()
    else:
        return "good posture", offset.item()
