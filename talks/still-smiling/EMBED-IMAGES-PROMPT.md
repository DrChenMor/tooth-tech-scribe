# Prompt: put the seven pictures into the talk deck

Copy everything below the line into a Claude Code session **running on Chen's own computer**, in the folder that has the deck and the pictures.

---

You are finishing a job that a cloud session could not finish, because the picture files only exist on this computer.

## What exists

A single self-contained HTML slide deck, `still-smiling-deck.html`. It is a 45 minute dental talk. It has no build step: you open it in a browser and it runs. All the content lives in one `SLIDES` array inside the `<script>` block.

If the file is not in this folder, get it from GitHub: repo `DrChenMor/tooth-tech-scribe`, branch `claude/presentation-svgs-voting-script-glfjxp`, path `talks/still-smiling/`.

Seven illustrations were generated in Magnific and downloaded to this computer. Their filenames are long and auto-generated. This is the mapping, worked out from the prompts that made them. **Use it exactly.**

| Magnific file starts with | Rename to | What it shows |
|---|---|---|
| `magnific__a-single-large-lower-molar-shown-in-vertical-cross__4089` | `tooth.png` | one molar in cross-section, gum and bone |
| `magnific__two-identical-lower-molars-side-by-side-each-shown__17118` | `bone.png` | same tooth twice: bone holding vs bone lost |
| `magnific__two-side-by-side-extreme-closeup-crosssections-of-__42172` | `pocket.png` | shallow healthy gum space vs deep pocket |
| `magnific__two-adjacent-lower-molars-seen-from-the-front-stan__92209` | `brush.png` | interdental brush going in sideways |
| `magnific__an-extreme-close-up-of-one-single-tooth-only-seen-__70381` | `brushing.png` | toothbrush at 45 degrees into the gum edge |
| `magnific__two-dental-objects-side-by-side-separated-by-a-ban__92211` | `scanner.png` | old impression tray vs digital scanner wand |
| `magnific__a-front-view-crosssection-of-the-front-part-of-a-l__92210` | `implants.png` | two implants with a lower denture clicking on |

## Step 1: make it work the easy way first

Create a folder `images/` next to `still-smiling-deck.html` and put the seven renamed files in it. Open the deck and click through. The pictures should now appear on seven slides.

**Do this first and confirm it works before doing anything else.** The deck already refers to `images/tooth.png` and so on. If step 1 does not work, something is wrong with the names, and step 2 will not fix it.

## Step 2: fold the pictures into the HTML so it becomes one single file

This is the real goal. Chen presents from a laptop at a venue with no reliable internet, and a file plus a folder is a thing that can go wrong on the day. One file cannot.

### How the deck loads a picture

Near the top of the script there is a function `photoArt(s)`. It builds an SVG containing:

```html
<image href="[whatever s.photo says]" ... onerror="window.__artFail(this,'[fallback drawing name]')"/>
```

`s.photo` is just a string. **A `data:` URI works there with no code changes.** That is the whole mechanism you are using.

### What to do

1. **Shrink the images first.** The originals are 1 to 3.3 MB each, about 18 MB total. Base64 inflates by a third, which would make a 24 MB HTML file. Far too big.

   The picture is drawn into a 560 x 430 box on a 1280 x 720 stage. Even on a 4K projector it never renders wider than about 1400 pixels. So:
   - resize the longest edge to **1600 px**
   - save as **WebP quality 88** (preferred), or **JPEG quality 85** if WebP is unavailable
   - target **under 400 KB each**, ideally around 250 KB

   Use whatever is installed: Python with Pillow, ImageMagick, `sips` on macOS. Your choice.

   One warning: these are soft illustrations with thin dark outlines on white. JPEG can produce faint halos around those outlines. WebP does not. Prefer WebP. Look at the result before accepting it.

2. **Add an `IMG` object** near the top of the `<script>` block, just above `const ART = {`:

   ```js
   const IMG = {
     tooth:    'data:image/webp;base64,....',
     bone:     'data:image/webp;base64,....',
     pocket:   'data:image/webp;base64,....',
     brush:    'data:image/webp;base64,....',
     brushing: 'data:image/webp;base64,....',
     scanner:  'data:image/webp;base64,....',
     implants: 'data:image/webp;base64,....'
   };
   ```

   Get the mime type right: `image/webp` for WebP, `image/jpeg` for JPEG. A wrong mime type makes the picture silently fail.

3. **Point the seven slides at it.** In the `SLIDES` array, change each one:

   | from | to |
   |---|---|
   | `photo:'images/tooth.png'` | `photo:IMG.tooth` |
   | `photo:'images/bone.png'` | `photo:IMG.bone` |
   | `photo:'images/pocket.png'` | `photo:IMG.pocket` |
   | `photo:'images/brush.png'` | `photo:IMG.brush` |
   | `photo:'images/brushing.png'` | `photo:IMG.brushing` |
   | `photo:'images/scanner.png'` | `photo:IMG.scanner` |
   | `photo:'images/implants.png'` | `photo:IMG.implants` |

   Quotes come off: `IMG.tooth` is a variable, not a string.

4. **Save it as a new file**, `still-smiling-deck-standalone.html`. Keep the original working. Chen should end up with both.

## Do not break these

- **The `art:` fallbacks stay.** Four slides carry both `photo:` and `art:` (a hand-drawn SVG). If a picture ever fails to load, that drawing appears instead. Do not remove them.
- **The `marks:` lines stay.** Two slides draw labels on top of the picture: `2 mm` and `6 mm` on the pocket slide, `BONE HOLDING` and `BONE GONE` on the bone slide. The pictures do not contain those words, and they are the point of those slides.
- **Do not reformat the file, reorder slides, or touch the `note:` arrays.** The notes are the read-aloud script for a teleprompter and they are finished.
- **Do not change any `at:` times or `cut:true` flags.** They drive the prompter's pace display.

## Check before you hand it over

- [ ] File opens by double-clicking, with the `images/` folder deleted or renamed. Nothing should break.
- [ ] Click right arrow through all 43 slides. No broken-image icons, no blank picture areas.
- [ ] The seven picture slides show the right picture. Check the mapping table above, especially `brush.png` (brush going in **sideways**) and `brushing.png` (single tooth, brush at **45 degrees**). Those two are easy to swap by mistake.
- [ ] The pocket slide still shows **2 mm** and **6 mm**. The bone slide still shows **BONE HOLDING** and **BONE GONE**.
- [ ] Press **P**. The prompter window opens with the script.
- [ ] In the prompter, **down arrow scrolls the script and the slide does not move**. Left and right move the slide. **S** skips a whole slide.
- [ ] Total file size under about 6 MB.
- [ ] Turn the wifi off and open it again. It must still work. Fonts will fall back to system fonts and that is fine and expected.

Report the final file size and anything that did not come out right.
