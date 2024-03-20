
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
async function loop() {
    if (count > 0) return;
    webcam.update(); // update the webcam frame
    console.time("time render frame");
    await predict(); // await
    console.timeEnd("time render frame");

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

    const [input, img_width, img_height] = await prepare_input(dataURL);

    const data1 = JSON.stringify({
        input: input,
        img_width: img_width,
        img_height: img_height
    });
    // console.log(data1);


    // await getNameClass(data1);

    const nameClass = await getNameClass(data1);
    labelContainer.childNodes[0].innerHTML = nameClass.name + ': ' + nameClass.prob;


}

async function getNameClass(data1) {
    // console.log("data gửi", data1);
    return fetch('/api/name', {
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
        .then(data => { // Xử lý dữ liệu trả về từ server
            return data;
            // labelContainer.childNodes[0].innerHTML = data.name + ': ' + data.prob;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

// const fetch = require('node-fetch');

// Hàm gọi API và trả về một Promise
// async function getNameClass(data1) {
//     const apiUrl = '/api/name'; // Địa chỉ URL của API
//     try {
//       const response = await fetch(apiUrl, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: data1,
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const data = await response.json(); // Chuyển đổi dữ liệu JSON từ phản hồi
//       console.log('Response from server:', data);
//       console.log("data.name: ", data.name);
//       return data.name; // Trả về dữ liệu từ máy chủ
//     } catch (error) {
//       console.error('There was a problem with the fetch operation:', error);
//       throw error;
//     }
//   }

// Sử dụng hàm getNameClass để gọi API và nhận kết quả
//   getNameClass()
//     .then(name => {
//       console.log('Name from server:', name); // Xử lý dữ liệu trả về từ máy chủ
//     })
//     .catch(error => {
//       console.error(error); // Xử lý lỗi nếu có
//     });



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
