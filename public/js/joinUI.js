document.addEventListener("DOMContentLoaded", () => {

  let scannerActive = false;
  let html5QrCode;
  let cameras = [];
  let currentCameraIndex = 0;

  const scanBtn = document.getElementById("scanBtn");
  const flipBtn = document.getElementById("flipBtn");
  const scannerBox = document.getElementById("scannerBox");

  flipBtn.style.display = "none";

  function startScanner(cameraId) {
    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: 250 },

      (decodedText) => {
        try {
          const url = new URL(decodedText);
          const code = url.searchParams.get("code");

          if (code) {
            document.getElementById("join_code").value = code;

            html5QrCode.stop();
            scannerBox.style.display = "none";
            flipBtn.style.display = "none";
            scannerActive = false;

            document.querySelector("form").submit();
          }
        } catch (err) {
          console.log("Invalid QR");
        }
      }
    );
  }

  scanBtn.addEventListener("click", () => {

    if (!scannerActive) {
      scannerBox.style.display = "block";
      Html5Qrcode.getCameras().then(devices => {
        cameras = devices;
        if (cameras.length > 0) {
          const backCam =
            cameras.find(c => c.label.toLowerCase().includes("back")) ||
            cameras[0];
          currentCameraIndex = cameras.indexOf(backCam);
          startScanner(backCam.id);
          if (cameras.length > 1) {
            flipBtn.style.display = "block";
          }
        }
      });

      scanBtn.innerText = "Stop Scanner";
      scannerActive = true;

    } else {

      html5QrCode.stop().then(() => {
        scannerBox.style.display = "none";
        flipBtn.style.display = "none";
        scanBtn.innerText = "Scan QR Code";
        scannerActive = false;
      });
    }
  });

  flipBtn.addEventListener("click", () => {
    if (cameras.length > 1) {
      currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

      html5QrCode.stop().then(() => {
        startScanner(cameras[currentCameraIndex].id);
      });
    }
  });

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    document.getElementById("join_code").value = code;
  }

});