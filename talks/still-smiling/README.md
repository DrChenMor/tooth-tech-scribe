# A Dentist Walks Into a Coffee Club

`still-smiling-deck.html` is the whole talk. One file, no build step. Double click it and it opens in your browser.

## On the day

| Key | What it does |
|---|---|
| Right arrow, space, click | next reveal, or next slide |
| Left arrow | back one reveal |
| Up / Down arrow | jump a whole slide, skipping reveals |
| **P** | open the prompter window |
| F | full screen |
| T | start or stop the clock |
| N | script overlay, for rehearsing on one screen |
| H | hide the little help text |
| Home | back to slide one |

The two screens must be set to **Extend**, not Mirror, or the prompter is useless. Rehearse once with a second screen before the day.

## The prompter

Press P. A second window opens with the script only. Arrow keys work in either window and both stay in step. A makes the text bigger, Z smaller.

Things it now does that are worth knowing:

- **One sentence per line.** Read a line, look up, say it. That is the trick that stops it sounding read.
- **Lines you have not revealed yet are dimmed.** During a paddle round you can only clearly read the statement you are actually on, so you cannot accidentally read the answer out early.
- **It scrolls itself** to the line matching the reveal you just pressed.
- **Pace.** Once you press T, the bar shows `+02:31 behind` in amber or red, or `-00:40 ahead` in green. That is you against the target time for the slide you are standing on.
- **OPTIONAL** appears in the bar on slides that are safe to skip, and the NEXT line at the bottom warns you when the next slide is one of them.

Colours in the prompter: red is a joke, green italic in brackets is a stage direction you never say out loud, white with a green underline is text the audience can see on the screen right now.

## Running to time

**This is the one thing still not solved.** With the brushing section in, the full script runs to roughly 55 minutes at reading pace, before laughter and before counting paddles. The slot is 45. That is ten minutes over, and no amount of talking faster fixes ten minutes.

Eight slides are marked optional in the code (`cut:true`). They show OPTIONAL in the prompter bar, and the NEXT line warns you when the next slide is one of them:

| Slide | Roughly |
|---|---|
| Enamel gets thinner | 0:30 |
| Old fillings get old too | 0:30 |
| Waterloo Teeth | 1:00 |
| The good news | 1:40 |
| Six things to look for | 1:50 |
| Three things wear teeth down | 2:00 |
| Now, our food | 2:30 |
| Round two, paddles up | 1:30 |

Dropping the first six gets you to about 47 minutes. That is as close as this gets without losing something you care about.

**Cut the second paddle round last.** The voting is what keeps the room with you, and round two is where two of the three surprising True answers live.

The honest alternative is to ask the group for an hour. Plenty of speaker clubs will say yes, and this talk is really an hour of material.

## The pictures

Seven slides are already pointed at image files. **Drop the files into the `images/` folder with these exact names and they appear on their own:**

| File to save | Which slide it lands on |
|---|---|
| `images/tooth.png` | The gum moves back. The root shows |
| `images/bone.png` | The tooth can be perfect and still be lost |
| `images/pocket.png` | 1, 2, 3 is fine. 4 and above is a pocket |
| `images/brush.png` | If you buy one thing this morning, buy these |
| `images/brushing.png` | How to actually brush |
| `images/scanner.png` | And the goop is going away |
| `images/implants.png` | Implants, honestly |

No code to edit. `.png` or `.jpg` both work, but the name has to match. If you save a `.jpg`, change that slide's `photo:` line to say `.jpg`.

**Nothing breaks if a file is missing or misspelled.** The first four slides fall back to their drawing. The last three have no drawing, so they simply drop the picture and the words go full width, exactly like an ordinary slide. You will never see a broken image in front of the room.

The last three slides keep their four or five bullet points sitting next to the picture, so adding an image costs you no content and no extra time.

### The numbers on top of a picture

Two slides keep their labels sitting on top of the photograph, because the picture alone does not say them:

- the pocket slide keeps **2 mm** and **6 mm**
- the bone slide keeps **BONE HOLDING** and **BONE GONE**

They are the `marks:` lines in the deck. `x` and `y` are fractions of the picture, so `x:.24` means a quarter of the way across and `y:.13` means near the top. If a label lands somewhere awkward on your image, change those two numbers and reload. Every label is drawn with a white outline behind it, so it stays readable wherever it sits.

## Adding a picture to a slide that has none

Any slide can take one. Change its `kind:'list'` to `kind:'art'`, then give it `art:'tooth'` (any of the four drawings, as the fallback) and `photo:'images/yourfile.png'`. An `art` slide shows a heading, one line of text and the picture, so the list items move into that one line.

## Fonts

Fonts come from Google. With no internet at the venue it falls back to the system fonts and still looks clean. Every label inside the illustrations has a pinned width, so nothing runs off the edge of a picture even when the fallback font is wider.
