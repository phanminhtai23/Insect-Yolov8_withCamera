
let webcam, labelContainer, model1;
// Load the image model and setup the webcam
async function init() {
    count = 0;
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

function webcamStop() {
    webcam.stop();
    count++;
}
// asyn
function loop() {
    if (count > 0) return;
    webcam.update(); // update the webcam frame
    predict(); // await

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
    // console.log(dataURL);
    const data1 = JSON.stringify({ dataURL: dataURL });
    // console.log(data1);
    const nameClass = getNameClass(data1);
    webcamStop();
    // labelContainer.childNodes[0].innerHTML = nameClass;

}

function getNameClass(data1) {
    // console.log("data gửi", data1);
    fetch('/api/name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data1,
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Trả về chuỗi kết quả từ server
        })
        .then(data => {
            console.log('Response from server:', data); // Xử lý dữ liệu trả về từ server
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
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
