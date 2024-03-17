const URL_cam = "./my_model/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
    const modelURL = URL_cam + "model.json";
    const metadataURL = URL_cam + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = false; // whether to flip the webcam
    webcam = new tmImage.Webcam(640, 640, flip); // width, height, flip
    await webcam.setup({ facingMode: "environment" }); // request access to the webcam
    // await webcam.setup({ deviceId: devices[2].deviceId });
    // await webcam.setup(); // request access to the webcam

    const devices = await navigator.mediaDevices.enumerateDevices()
    console.log(devices);

    await webcam.play();
    window.requestAnimationFrame(loop);

    // Nếu chưa tạo thì tạo ô hiển thị nhãn
    labelContainer1 = document.getElementById("label-container");
    if (!labelContainer1) {
        var container = document.getElementById("webcam-container");
        var square = document.createElement("div");
        square.setAttribute("id", "label-container");
        container.appendChild(square);

        var element = document.getElementById("label-container");
        // Thiết lập kích thước chữ và màu chữ
        element.style.fontSize = "20px";
        element.style.color = "red";
    }



    // xóa thẻ canvas nếu có
    var container = document.getElementById("webcam-container");
    var canvas = container.querySelector("canvas");

    if (canvas) {
        // Nếu tồn tại phần tử canvas, thì xóa nó
        canvas.remove();
        console.log("xóa canvas ok");
    }
    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function webcamStop() {
    webcam.stop();
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    var max_pro = -1;
    var index = -1;
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > max_pro) {
            index = i;
            max_pro = prediction[i].probability.toFixed(2);
        }
    }
    const classPrediction =
        prediction[index].className + ": " + max_pro;
    labelContainer.childNodes[0].innerHTML = classPrediction;
}
