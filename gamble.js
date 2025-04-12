// function handleAnimation(func: (time: DOMHighResTimeStamp)=>any) {
//     if (document.visibilityState !== "hidden") {
//         requestAnimationFrame(t => {
//             return func(t);
//         });
//     } else {
//         setTimeout(() => {
//             const t = performance.now();
//             return func(t);
//         }, 1000/30);
//     }
// }
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Gamble {
    constructor(elm, slots, items, options = {}) {
        this.elm = elm;
        this.slots = slots;
        this.items = items.map(item => { return item.cloneNode(true); });
        this.result = Array(slots).fill(0);
        this.currentpos = this.result;
        this.options = options;
        this.currently_gambling = false;
        // Create Slots
        for (let i = 0; i < slots; i++) {
            const slot = document.createElement("div");
            slot.classList.add("gamble-slot");
            const slotmove = document.createElement("div");
            slotmove.classList.add("gamble-slot-move");
            // Create Items
            slotmove.append(...[items[items.length - 1], ...items, items[0]].map((item, index) => {
                const htmlelm = document.createElement("div");
                htmlelm.classList.add("gamble-slot-item");
                htmlelm.append(item.cloneNode(true));
                htmlelm.setAttribute("gamble-pos", (index - 1).toString());
                return htmlelm;
            }));
            slot.append(slotmove);
            elm.append(slot);
            // this.itemheight = slotmove.children[0].clientHeight;
            requestAnimationFrame(() => {
                this.itemheight = slot.clientHeight;
                // slot.style.height = this.itemheight + "px";
                elm.style.setProperty("--gamble-item-height", this.itemheight + "px");
                slotmove.style.top = -this.itemheight + "px";
                this.slotwheelheight = this.itemheight * items.length;
                this.setslot(i, Math.floor(Math.random() * this.items.length));
            });
        }
    }
    gamble(special = (n) => { return n; }) {
        // use Special to define a function to be applied to the raw values of Math.random()*this.items.length BEFORE flooring them.
        // This can be used to make some values harder to get
        if (this.currently_gambling === true)
            return;
        this.elm.dispatchEvent(new Event("gambling"));
        // Gamble
        this.currently_gambling = true;
        const raw = Array(this.slots).fill(undefined).map(() => { return Math.random() * this.items.length; });
        const result = raw.map(item => Math.floor(special(item)));
        // Animate
        (() => __awaiter(this, void 0, void 0, function* () {
            let promising = result.map((res, i) => { return res - this.result[i]; }).map((val, index) => {
                return this.moveslot(index, val + (((index * 2) + 5) * this.items.length));
                // 5 is an arbritary number to make the gambling longer
            });
            Promise.all(promising).then(() => {
                this.currently_gambling = false;
            });
        }))();
        // Set results
        this.result = result;
        return result;
    }
    getpos(slotnum, entry) {
        // If slotnum is -1, entry is absolute.
        // If slotnum is 0 or above, entry will be relative to the slot
        if (slotnum < 0) {
            const result = entry % this.items.length;
            return result < 0 ? this.items.length + result : result;
        }
        else {
            return (this.currentpos[entry] + entry) % this.items.length;
        }
    }
    setslot(slotnum, entry) {
        const slot = this.elm.querySelector(`.gamble-slot:nth-child(${slotnum + 1}) > .gamble-slot-move`);
        const fixed_entry = Math.abs(entry - Math.trunc(entry / this.items.length) * this.items.length);
        slot.style.top = (-this.itemheight - (fixed_entry * this.itemheight)) + "px";
        this.currentpos[slotnum] = this.getpos(-1, entry);
    }
    moveslot(slotnum, by, speed = 0) {
        // by = -by; // I developed this function the wrong way around :/
        if (speed <= 0)
            speed = this.itemheight * 0.01;
        let finished;
        let promise = new Promise((resolve) => {
            finished = resolve;
        });
        let zerotime;
        let current = 0;
        let bypx = by * this.itemheight;
        let negative = false;
        if (bypx < 0) {
            negative = true;
            bypx = -bypx;
        }
        ;
        const warn_top = 0;
        const warn_bottom = this.slotwheelheight;
        const total_height = this.slotwheelheight;
        const slot_parent = this.elm.querySelector(`.gamble-slot:nth-child(${slotnum + 1})`);
        const slot = this.elm.querySelector(`.gamble-slot:nth-child(${slotnum + 1}) > .gamble-slot-move`);
        let current_subpx = slot.offsetTop; // because slot.offsetTop isn't precise
        let slot_relative_offset = (offset) => { };
        // console.log(bypx, negative);
        if (negative) {
            slot_relative_offset = function (offset) {
                current_subpx += offset;
                slot.style.top = current_subpx + "px";
            };
        }
        else {
            slot_relative_offset = function (offset) {
                current_subpx -= offset;
                slot.style.top = current_subpx + "px";
            };
        }
        function cleanOvershoot() {
            if (negative) {
                while (-current_subpx < warn_top) {
                    slot_relative_offset(-total_height);
                }
            }
            else {
                while (-current_subpx > warn_bottom) {
                    slot_relative_offset(-total_height);
                }
            }
        }
        function animate(time) {
            // console.log(time - zerotime);
            // Animate movement
            const offset = (time - zerotime);
            const pxoffset = offset * speed;
            if (!(current + pxoffset < bypx)) {
                slot_relative_offset(bypx - current);
                slot_parent.dispatchEvent(new Event("rollingend"));
                cleanOvershoot();
                finished();
                return;
            }
            ;
            slot_relative_offset(pxoffset);
            current += pxoffset;
            cleanOvershoot();
            // Setup for next frame
            zerotime = time;
            requestAnimationFrame(animate);
        }
        ;
        requestAnimationFrame((time) => {
            slot_parent.dispatchEvent(new Event("rollingstart"));
            // First frame
            zerotime = time;
            requestAnimationFrame(animate);
        });
        return promise;
    }
    resize() {
        this.elm.style.removeProperty("--gamble-item-height");
        const step1 = function () {
            this.itemheight = document.querySelector(".gamble-slot").clientHeight;
            this.elm.style.setProperty("--gamble-item-height", this.itemheight + "px");
            this.slotwheelheight = this.itemheight * this.items.length;
            requestAnimationFrame(step2);
        }.bind(this);
        const step2 = function () {
            [...Array(this.slots).keys()].forEach(i => {
                this.setslot(i, this.currentpos[i]);
            });
        }.bind(this);
        requestAnimationFrame(step1);
    }
}
class Machine {
    constructor(gamble, machine, image, display, button) {
        this.sounds = {
            files: {
                "lever": "./assets/sounds/clank1.mp3",
                "rolling": "./assets/sounds/rolling.mp3",
                "result-selected": "./assets/sounds/rolling-end.mp3"
            },
            playing: {},
            play: function (str_1) {
                return __awaiter(this, arguments, void 0, function* (str, options = { loop: false, random: false }) {
                    var _a;
                    if (!((_a = this.sounds.files) === null || _a === void 0 ? void 0 : _a[str]))
                        throw new SyntaxError("Playback needs valid file. Got " + str);
                    // Create Audio
                    const audio = new Audio(this.sounds.files[str]);
                    yield new Promise((resolve) => audio.onloadedmetadata = resolve);
                    audio.loop = options.loop;
                    if (options.random)
                        audio.currentTime = Math.random() * audio.duration;
                    audio.play();
                    // Identify
                    const id = crypto.randomUUID();
                    this.sounds.playing[id] = audio;
                    // Return
                    return { audio: audio, id: id };
                });
            }.bind(this),
            end: function (val) {
                if (typeof val === "string") {
                    this.sounds.playing[val].pause();
                    delete this.sounds.playing[val];
                }
                else {
                    val.pause();
                }
            }.bind(this)
        };
        this.gamble = gamble;
        function setpercentstuff(elm, left, top, width, height) {
            [["left", left], ["top", top], ["width", width], ["height", height]].forEach(([s, v]) => elm.style[s] = v + "%");
        }
        // Machine
        machine.style.backgroundImage = `url(${image.path})`;
        // Set content
        let inner = document.createElement("div");
        inner.classList.add("gamble-machine-inner");
        setpercentstuff(inner, display.x / image.x * 100, display.y / image.y * 100, display.dx / image.x * 100, display.dy / image.y * 100);
        // Set button
        setpercentstuff(button.elm, (button.x - button.r) / image.x * 100, (button.y - button.r) / image.y * 100, button.r * 2 / image.x * 100, button.r * 2 / image.y * 100);
        button.elm.style.setProperty("--gamble-button-radius", button.r / ((button.x + button.r * 2) / image.x) * 100 + "%");
        // Combine
        inner.append(gamble.elm);
        machine.append(inner, button.elm);
        this.elm = machine;
        this.button = button.elm;
        // Setup Gambling
        button.elm.addEventListener("click", () => {
            this.sounds.play("lever");
            setTimeout(() => {
                this.gamble.gamble();
            }, 250);
        });
        gamble.elm.querySelectorAll(".gamble-slot").forEach(slot => slot.addEventListener("rollingstart", (e) => __awaiter(this, void 0, void 0, function* () { return slot.setAttribute("data-sound", (yield this.sounds.play("rolling", { loop: true, random: true })).id); })));
        gamble.elm.querySelectorAll(".gamble-slot").forEach(slot => slot.addEventListener("rollingend", (e) => { this.sounds.end(slot.getAttribute("data-sound")); this.sounds.play("result-selected"); }));
    }
}
//# sourceMappingURL=gamble.js.map