let items = [1, 2, 3, 4, "!!"].map(item => {
    const html = document.createElement("div");
    html.classList.add("custom-big");
    html.innerText = item;
    return html;
});

var gambler, machine;
window.addEventListener("load", () => {
    gambler = new Gamble(document.getElementById("maingamble"), 3, items);
    const image = {
        path: "./assets/slot-machine.png",
        x: 512,
        y: 512
    }
    const display = {
        x: 61,
        y: 173,
        dx: 327,
        dy: 158
    }
    const button = {
        elm: document.getElementById("maingamble_gamble"),
        x: 450,
        y: 105,
        r: 25
    }
    machine = new Machine(gambler, document.getElementById("mainmachine"), image, display, button);
    window.addEventListener("resize", () => gambler.resize());
    // document.getElementById("maingamble_gamble").addEventListener("click", ()=>{gambler.gamble()});
});