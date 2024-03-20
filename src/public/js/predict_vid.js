
let webcam, labelContainer, model1, count;
// Load the image model and setup the webcam
async function init() {
    count = 0; // biến điếm dừng camera

    model1 = await ort.InferenceSession.create("../last.onnx");

    // Convenience function to setup a webcam
    const flip = false; // whether to flip the webcam
    webcam = new tmImage.Webcam(640, 640, flip); // width, height, flip
    await webcam.setup({ facingMode: "environment" }); // request access to the webcam

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
    var table1 = infor.querySelector("table");
    if (table1) {
        table1.remove();
    }
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
    labelContainer.appendChild(document.createElement("div"));
}

async function webcamStop() {
    webcam.stop();
    count++;
}

async function loop() {
    if (count > 0) return;
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {

    // lấy fram ảnh để predict
    const canvas1 = document.createElement('canvas');
    const ctx = canvas1.getContext('2d');
    // Vẽ frame ảnh từ webcam lên canvas
    ctx.drawImage(webcam.canvas, 0, 0, canvas1.width, canvas1.height);
    // Chuyển đổi nội dung của canvas thành một URL dữ liệu
    const dataURL = canvas1.toDataURL();
    console.time('thời gian/ khung ảnh');
    const boxes = await detect_objects_on_image(dataURL);
    render_prob(boxes);
}
// * @param boxes Array of bounding boxes in format [[x1,y1,x2,y2,object_type,probability],...]
function render_prob(boxes) {
    if (boxes.length > 0) {
        const classPrediction = boxes[0][4] + ": " + boxes[0][5].toFixed(2);
        labelContainer.childNodes[0].innerHTML = classPrediction;
        console.timeEnd('thời gian/ khung ảnh');
    } else {
        labelContainer.childNodes[0].innerHTML = "Unknow"
        console.timeEnd('thời gian/ khung ảnh');
    }
}
