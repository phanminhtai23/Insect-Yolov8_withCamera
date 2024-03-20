const express = require('express');
require('dotenv').config()
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const hostname = process.env.HOST_NAME;
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.static(path.join(__dirname, '../src/public')))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' , extended: true}));

app.get('/', (req, res) => {
    res.send("index.html");
});

// Route để lấy thông tin người dùng theo ID
app.get('/api/information/:id', (req, res) => {
    fs.readFile('C:/Users/MINH TAI/Desktop/Nhận dạng côn trùng hại lúa/code/tensorflow/sever1/src/public/data/data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        const users = JSON.parse(data);
        const userId = parseInt(req.params.id);
        const user = users.find(user => user.id === userId);
        if (user) {
            res.json(user);
            console.log("sever tra data", user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});

// predic img
app.post('/api/name', (req, res) => {
    const { dataURL } = req.body;
    // console.log("data nhận: ", dataURL);

    const boxes = detect_objects_on_image(dataURL);
    console.log(boxes[0][4]);
    // draw_image_and_boxes(urlBase64, boxes);

    // Trả về kết quả phân tích hình ảnh dưới dạng JSON
    var json1 = JSON.stringify({ name: "ok" })
    console.log(json1);
    res.json(json1);
});

app.listen(port, hostname, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
});


function draw_image_and_boxes(file, boxes) {
    const img = new Image()
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        const canvas = document.querySelector("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3;
        ctx.font = "18px serif";
        boxes.forEach(([x1, y1, x2, y2, label]) => {
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = "#00ff00";
            const width = ctx.measureText(label).width;
            ctx.fillRect(x1, y1, width + 10, 25);
            ctx.fillStyle = "#000000";
            ctx.fillText(label, x1, y1 + 18);
        });
    }
}


async function detect_objects_on_image(buf) {
    const [input, img_width, img_height] = await prepare_input(buf);
    const output = await run_model(input);
    return process_output(output, img_width, img_height);
}

async function prepare_input(buf) {
    return new Promise(resolve => {
        const img = new Image();
        img.src = buf;
        img.onload = () => {
            const [img_width, img_height] = [img.width, img.height]
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 640;
            const context = canvas.getContext("2d");
            context.drawImage(img, 0, 0, 640, 640);
            const imgData = context.getImageData(0, 0, 640, 640);
            const pixels = imgData.data;

            const red = [], green = [], blue = [];
            for (let index = 0; index < pixels.length; index += 4) {
                red.push(pixels[index] / 255.0);
                green.push(pixels[index + 1] / 255.0);
                blue.push(pixels[index + 2] / 255.0);
            }
            const input = [...red, ...green, ...blue];
            resolve([input, img_width, img_height])
        }
    })
}
async function run_model(input) {
    const model = await ort.InferenceSession.create("yolov8m.onnx");
    input = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]);
    const outputs = await model.run({ images: input });
    return outputs["output0"].data;
}

/**
 * Function used to convert RAW output from YOLOv8 to an array of detected objects.
 * Each object contain the bounding box of this object, the type of object and the probability
 * @param output Raw output of YOLOv8 network
 * @param img_width Width of original image
 * @param img_height Height of original image
 * @returns Array of detected objects in a format [[x1,y1,x2,y2,object_type,probability],..]
 */
function process_output(output, img_width, img_height) {
    let boxes = [];
    for (let index = 0; index < 8400; index++) {
        const [class_id, prob] = [...Array(80).keys()]
            .map(col => [col, output[8400 * (col + 4) + index]])
            .reduce((accum, item) => item[1] > accum[1] ? item : accum, [0, 0]);
        if (prob < 0.5) {
            continue;
        }
        const label = yolo_classes[class_id];
        const xc = output[index];
        const yc = output[8400 + index];
        const w = output[2 * 8400 + index];
        const h = output[3 * 8400 + index];
        const x1 = (xc - w / 2) / 640 * img_width;
        const y1 = (yc - h / 2) / 640 * img_height;
        const x2 = (xc + w / 2) / 640 * img_width;
        const y2 = (yc + h / 2) / 640 * img_height;
        boxes.push([x1, y1, x2, y2, label, prob]);
    }

    boxes = boxes.sort((box1, box2) => box2[5] - box1[5])
    const result = [];
    while (boxes.length > 0) {
        result.push(boxes[0]);
        boxes = boxes.filter(box => iou(boxes[0], box) < 0.7);
    }
    return result;
}


function iou(box1, box2) {
    return intersection(box1, box2) / union(box1, box2);
}

function union(box1, box2) {
    const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
    const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
    const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
    const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
    return box1_area + box2_area - intersection(box1, box2)
}

function intersection(box1, box2) {
    const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
    const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
    const x1 = Math.max(box1_x1, box2_x1);
    const y1 = Math.max(box1_y1, box2_y1);
    const x2 = Math.min(box1_x2, box2_x2);
    const y2 = Math.min(box1_y2, box2_y2);
    return (x2 - x1) * (y2 - y1)
}

/**
 * Array of YOLOv8 class labels
 */
const yolo_classes =
    ['Sâu đục thân', 'Bọ xít đen', 'Bù lạch',
        'Dế nhũi', 'Rầy lưng xanh', 'Rầy nâu', 'Sâu cuốn lá'];
