import chroma from "chroma-js";
import SimplexNoise from "simplex-noise";

let canvas, ctx, stopLoop, simplex;

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

const drawPanel = (vertices, color, x, y, size, opacity = -1) => {
  ctx.fillStyle = color
    .mix("#b6cee2", (1 - y / window.innerHeight) ** 3 * 0.8)
    .alpha(opacity === -1 ? (random() ** 2 + 0.4) * 0.8 : opacity);
  drawPolygon(
    vertices.map((from) =>
      translate(scale(from, (y / window.innerHeight) * 2 * size), [
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

  if (chance(0.5)) {
    const balcony = [
      [-10, 0 - 4],
      [0 + rotation, 5 - 4],
      [0 + rotation, 0],
      [-10, -5],
    ];
    for (var i = 0; i < height * 2; i += 4) {
      drawPanel(
        balcony,
        baseColor.darken(2),
        x,
        y - i * (y / window.innerHeight),
        size,
        0.1
      );
    }
  }

  const right = [
    [0 + rotation, 5 - height],
    [10, 0 - height],
    [10, -5],
    [0 + rotation, 0],
  ];
  drawPanel(right, baseColor.darken(4), x, y, size, 1);
};
const drawBuilding = ({ x, y }) => {
  const perspectiveScale = y / window.innerHeight;
  const noise =
    (simplex.noise2D(
      (x - window.innerWidth / 2) / 300 / perspectiveScale,
      Math.sqrt(y) / 3
    ) +
      1) *
    0.5;
  const height = noise > 0.7 ? random(60, 80) : random(40, 45);
  //   console.log(noise);
  //   const height = noise ** 2 * 80 + 40;
  const rotation = chance(0.4) ? random(-4, 4) : 0;
  const size = random(0.8, 1.2);
  drawBlock({ x, y, size, height, rotation });

  //   if (chance(0.25)) {
  //     drawBlock({
  //       x,
  //       y: y - perspectiveScale * (2 * height - random(20)),
  //       size: size / 2,
  //       height: 10,
  //       rotation,
  //     });
  //   }
};

const addNoise = () => {
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = chroma("#b6cee2").alpha(random(0.2));
  ctx.fillRect(random(window.innerWidth), random(window.innerHeight), 1, 1);
};

let y = HORIZON;
const tick = () => {
  y += (y / window.innerHeight) ** 2 / (window.innerWidth / 200);
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

  simplex = new SimplexNoise();

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
