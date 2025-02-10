const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const module = await WebAssembly.compileStreaming(fetch("brush.wasm"));
const memory = new WebAssembly.Memory({ initial: 1 });
const instance = await WebAssembly.instantiate(module, {
    "env": {
        memory,
        copy_pixels_from_memory(ptr, x, y, w, h) {
            if (w <= 0 || h <= 0) return;
            const data = new ImageData(new Uint8ClampedArray(memory.buffer, ptr, w * h * 4), w, h);
            ctx.putImageData(data, x, y);
        },
        copy_pixels_to_memory() {}
    }
});

console.log(module);

let penDown = false;
let strokeStartTime = 0;
let strokeJitter = Math.random();

for (const exportName in instance.exports) {
    if (exportName.startsWith("setting/")) {
        const settingName = exportName.substring(8);
        const global = instance.exports[exportName];
        const div = document.createElement("div");

        const label = document.createElement("span");
        label.textContent = `${settingName} = ${global.value.toFixed(1)}`;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "100";
        slider.value = `${global.value}`;
        slider.step = "0.1";

        div.append(label, slider);
        document.body.append(div);

        slider.addEventListener("input", () => {
            global.value = +slider.value;
            label.textContent = `${settingName} = ${global.value.toFixed(1)}`;
        });
    }
}

/**
 * @param {PointerEvent} e 
 */
function penInput(e) {
    const callback = instance.exports["callback/pen_input"];
    if (!callback) return;
    if (!penDown) return;
    const timestamp = (e.timeStamp - strokeStartTime) * 1000000;
    const flags = e.pressure > 0 ? 0x0001 : 0x0000;
    const x = e.offsetX;
    const y = e.offsetY;
    const { pressure, tiltX, tiltY } = e;
    const jitter = Math.random();
    callback(timestamp, flags, x, y, pressure, tiltX, tiltX, jitter, strokeJitter);
}

canvas.addEventListener("pointerdown", e => {
    penDown = true;
    strokeStartTime = e.timeStamp;
    strokeJitter = Math.random();
    penInput(e);
});
canvas.addEventListener("pointermove", penInput);
canvas.addEventListener("pointerup", e => { penInput(e); penDown = false; });