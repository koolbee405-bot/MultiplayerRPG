# 3D Home Office

A first-person walkthrough of a 15 ft × 12 ft modern home office, built with
[Three.js](https://threejs.org) (r160, bundled in `vendor/`, so no internet or install needed).

Includes light oak plank floors, white walls, a large three-pane window, a desk with a
monitor/keyboard/mouse and PC tower, an office chair, two walnut bookshelves, a couch with a
coffee table and rug, a floor lamp, framed art, a door, and several plants.

## Open it

Either:

- **Double-click `index.html`** — it runs straight from the file system, or
- serve the folder and browse to it:

  ```bash
  cd home-office-3d
  python3 -m http.server 8000
  # then open http://localhost:8000
  ```

## Controls

| Input | Action |
| --- | --- |
| Click | Capture the mouse and start exploring |
| W A S D / arrow keys | Move |
| Mouse | Look around |
| Shift | Walk faster |
| L | Toggle the floor lamp |
| R or **Reset view** button | Return to the starting position |
| Esc | Release the mouse (shows the instructions again) |

You can't walk through walls or furniture.

## Files

```
index.html   page, instructions overlay, HUD
style.css    overlay / HUD styling
main.js      room, furniture, lighting, controls (units are meters)
vendor/      three.min.js + license
```
