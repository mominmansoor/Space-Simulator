# Space Simulator

An interactive 3D solar system that runs in your browser. The Sun sits in the middle, the eight planets orbit it, a few moons tag along and there is an asteroid belt between Mars and Jupiter. Click a planet and the camera follows it around.

I made it to get comfortable with React Three Fiber, and I ended up caring a lot more about how it looks than I planned to.

## What you can do

- Drag to rotate, scroll to zoom. Zoom heads toward wherever your cursor is, which makes it easy to get close to a small planet.
- Click any planet to lock the camera onto it and read a quick summary. Press Space to let go.
- See how far the selected planet is from the Sun in AU.
- Pause time, or set the speed anywhere from 0.25x up to 5x.
- Turn orbit rings and planet labels on or off.
- Watch a live UTC clock tick away in the HUD, which is mostly there because it looks cool.

## A few things worth knowing

The asteroid belt is 3,000 points scattered between the orbits of Mars and Jupiter, with more of them bunched toward the middle of the belt.

Planet textures are generated in code on a canvas, so the app never has to download an image to draw a planet. It also means the repo stays small.

Distances and sizes are scaled so everything is visible on one screen. Planets are bigger and closer together than they are in real life, and the numbers shown for AU are worked out from the scaled orbits where Earth sits at 1.0.

## Stack

- React 19
- Three.js with React Three Fiber and Drei
- React Postprocessing for the glow effects
- GSAP for the camera moves
- Tailwind CSS 4
- Vite

## Running it

```bash
git clone https://github.com/mominmansoor/Space-Simulator
cd Space-Simulator
npm install
npm run dev
```

Then open the address Vite prints, usually http://localhost:5173.

To make a production build, run `npm run build`, and use `npm run preview` to look at the result.

## Project layout

```
src/
  components/   Scene, Planet, Moon, Sun, AsteroidBelt, Starfield, HUD and friends
  data/         planet and moon definitions
  hooks/        selection, pause and speed state
  utils/        procedural texture generation
```
