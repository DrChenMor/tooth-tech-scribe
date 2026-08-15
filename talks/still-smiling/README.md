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

The full script is around 52 minutes at reading pace, before laughter and before counting paddles. Four slides are marked optional in the code (`cut:true`) and show OPTIONAL in the prompter:

1. Waterloo Teeth
2. Enamel gets thinner
3. Old fillings get old too
4. The second paddle round

Cutting the first three saves about two minutes and costs almost nothing. **Cut the second paddle round last.** The voting is what keeps the room with you, and round two is where the two surprising True answers live.

## Swapping in your own pictures

The four drawn illustrations live in the `ART` object at the top of the script. Any of them can be replaced with a real image with no code knowledge:

1. Put the file in this folder's `images/` folder, for example `images/pocket.jpg`
2. Find the slide in the `SLIDES` list, for example the one with `art:'pocket'`
3. Add one thing to it: `photo:'images/pocket.jpg'`

So the line becomes:

```js
{kind:'art', sec:'The gums', at:'15:10', art:'pocket', photo:'images/pocket.jpg',
```

If the file is missing or misspelled, the slide quietly falls back to the drawing. Nothing breaks in front of the room.

The four are `tooth` (gum receded, root showing), `posts` (bone holding versus bone gone), `pocket` (2 mm versus 6 mm), `brush` (floss versus interdental brush).

## Fonts

Fonts come from Google. With no internet at the venue it falls back to the system fonts and still looks clean. Every label inside the illustrations has a pinned width, so nothing runs off the edge of a picture even when the fallback font is wider.
