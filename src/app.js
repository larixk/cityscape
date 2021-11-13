import chroma from "chroma-js";

let canvas, ctx, stopLoop;

const HORIZON = 50;

const startRafLoop = (runEveryFrame) => {
  let rafId;
  const performRafTick = () => {
    rafId = requestAnimationFrame(performRafTick);
    for (var i = 0; i < 1000; i++) {
      runEveryFrame();
    }
  };
  performRafTick();

  return () => cancelAnimationFrame(rafId);
};

const random = (x = 1, y) => {
  let min, max;
  if (typeof y === "undefined") {
    min = 0;
    max = x;
  } else {
    min = x;
    max = y;
  }
  return min + Math.random() * (max - min);
};

const chance = (percentage) => random() < percentage;

const drawPolygon = (vertices) => {
  ctx.beginPath();
  ctx.moveTo(vertices[0][0], vertices[0][1]);
  for (var i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i][0], vertices[i][1]);
  }
  ctx.closePath();
};

const translate = (from, to) => [from[0] + to[0], from[1] + to[1]];
const scale = (from, factor) => [from[0] * factor, from[1] * factor];

const drawPanel = (vertices, color, x, y, size) => {
  ctx.fillStyle = color
    .mix("#b6cee2", (1 - y / window.innerHeight) * 0.5)
    .alpha((random() ** 2 + 0.4) * 0.8);
  drawPolygon(
    vertices.map((from) =>
      translate(scale(from, (y / window.innerHeight) * 4 * size), [
        x,
        y - HORIZON,
      ])
    )
  );
  ctx.fill();
};

const drawBlock = ({ x, y, rotation, height, size }) => {
  let baseColor = chroma("#dcc6b2").mix("#4f6584", random());
  //   if (chance(0.8)) {
  //     baseColor = baseColor.desaturate(10);
  //   }
  baseColor = baseColor.brighten(random(2));
  const roof = [
    [-10, 0 - height],
    [0 - rotation, -5 - height],
    [10, 0 - height],
    [0 + rotation, 5 - height],
  ];
  drawPanel(roof, baseColor.darken(random(0, 2)), x, y, size);

  const left = [
    [-10, 0 - height],
    [0 + rotation, 5 - height],
    [0 + rotation, 0],
    [-10, -5],
  ];
  drawPanel(left, baseColor.brighten(1), x, y, size);

  const right = [
    [0 + rotation, 5 - height],
    [10, 0 - height],
    [10, -5],
    [0 + rotation, 0],
  ];
  drawPanel(right, baseColor.darken(3), x, y, size);
};
const drawBuilding = ({ x, y }) => {
  const perspectiveScale = y / window.innerHeight;
  const height = chance(0.1) ? random(60, 80) : random(40, 45);
  const rotation = chance(0.4) ? random(-4, 4) : 0;
  drawBlock({ x, y, size: 1, height, rotation });

  if (chance(0.25)) {
    drawBlock({
      x,
      y: y - perspectiveScale * (4 * height - random(20)),
      size: 0.5,
      height: 10,
      rotation,
    });
  }
};

const addNoise = () => {
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = chroma("#b6cee2").alpha(random(0.2));
  ctx.fillRect(random(window.innerWidth), random(window.innerHeight), 1, 1);
};

let y = HORIZON;
const tick = () => {
  y += (y / window.innerHeight) ** 2 / (window.innerWidth / 2000);
  drawBuilding({
    x: random(window.innerWidth),
    y,
  });

  if (y > window.innerHeight + HORIZON + 500) {
    // for (var i = 0; i < 1000; i++) {
    //   addNoise();
    // }
    stopLoop();
  }
};

const init = () => {
  canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");

  document.body.appendChild(canvas);
  document.body.style.margin = 0;

  stopLoop = startRafLoop(tick);
};

init();

const destroy = () => {
  document.body.removeChild(canvas);
  stopLoop();
};

if (module.hot) {
  module.hot.dispose(destroy);
}
