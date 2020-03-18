const videoFrame = document.getElementById('videoFrame')
const video = document.getElementById('video')
const data = document.getElementById('data')
data.innerHTML = 'DATA';
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia({
      video: {}
    },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}
video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  videoFrame.append(canvas)
  const displaySize = {
    width: video.width,
    height: video.height
  }
  const imagePlaneWidthCm = 26.6;
  const focalLenCm = 30.48;
  const imagePlaneWidthPx = canvas.width;
  const headWidthWorldCm = 14;
  const focalLenPx = (imagePlaneWidthPx * focalLenCm) / imagePlaneWidthCm;
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    // const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    //   .withFaceLandmarks()
    //    // .withFaceExpressions()
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 256
        // scoreThreshhold: 0.9
      }))
      .withFaceLandmarks()
    // .withFaceExpressions()
    if (!detections) {
      // data.innerHTML = '-';
      return;
    }
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    // faceapi.draw.drawDetections(canvas, resizedDetections)
    // const leftEye = resizedDetections[0].getLeftEye()
    if (resizedDetections && resizedDetections.detection) {
      let leftEye = resizedDetections.landmarks.getLeftEye()[0];
      let rightEye = resizedDetections.landmarks.getRightEye()[0];
      let nose = resizedDetections.landmarks.getNose()[0];
      let jaw = resizedDetections.landmarks.getJawOutline();
      let headWidthPx = Math.sqrt(Math.pow(jaw[16]._x - jaw[0]._x, 2) + Math.pow(jaw[16]._y - jaw[0]._y, 2));
      // Solve for head Distance
      let msg = `
      w,h [${canvas.width},${canvas.height}]
      Position [${Math.round(nose._x)}px,${Math.round(nose._y)}px]
      - on paper [${Math.round(getImagePlaneCm(nose._x))}cm,${Math.round(getImagePlaneCm(nose._y))}cm]

      Head width [14cm]
      - image      [${Math.round(headWidthPx)}px]
      - on paper   [${Math.round(getImagePlaneCm(headWidthPx))}cm]
      - distance   [${Math.round(worldPosition(headWidthPx,canvas.width-nose._x))}][${Math.round(worldPosition(headWidthPx,canvas.height-nose._y))}][${Math.round(headWorldDistance(headWidthPx))}cm]
      `;
      msg = msg.replace(/\n/g, '</br>');
      // console.log(jaw);
      data.innerHTML = msg;
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    } else {
      // data.innerHTML = 'x';
    }
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 1000 / 24)

  function getImagePlaneCm(px) {
    return (imagePlaneWidthCm * px) / imagePlaneWidthPx;
  }

  function headWorldDistance(headWidthPx) {
    return headWidthWorldCm * focalLenCm / getImagePlaneCm(headWidthPx);
  }

  function worldPosition(headWidthPx, px) {
    return headWidthWorldCm * px / headWidthPx;
  }
})
