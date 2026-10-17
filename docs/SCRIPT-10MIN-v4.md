# "Provided For" - the long film, v4 (10:00)

v4 is made entirely on the laptop. Nothing is filmed. Every image is drawn, animated, rendered in Remotion, or a screen recording from this MacBook. That limit is the idea: **the whole film happens on one endless sheet of paper**, and the camera never cuts away from it. It pans, dives, zooms out, and the paper folds, tears, lifts and lights up to become every set we need.

Rules from `CONTRACT.md` still apply: the first app is never named, the family is fictional, and nothing appears on glass that was not first drawn on paper.

---

## The big idea: one endless sheet

The film is one continuous camera move across a giant drawing, about 40 A3 sheets wide. Chapters are regions of that drawing. We travel between them along a single pencil line that never breaks, from the first frame to the last.

```
[the line starts] -> Maya's paper house -> the rejection letters -> the filter machine
-> the research board -> the name -> the design table -> the engine room (code)
-> the launch rocket -> the question -> the family village -> paper lifts into glass -> [the line ends at the pencil]
```

Why it works on a laptop: one Remotion canvas, one virtual camera with keyframed position and zoom, every scene a layer. No cuts means no jarring transitions, and the pencil line gives the eye something to follow, which fixes the "long waiting" problem: something is always moving.

## Visual languages (all made in Remotion or recorded on screen)

| Language | Looks like | How it's made | Used for |
| --- | --- | --- | --- |
| **Live pencil** | Graphite lines drawing themselves | SVG path stroke animation (`strokeDashoffset`), paper texture, slight jitter | Everything by default |
| **Paper craft** | Sheets that fold, pop up, tear, cast soft shadows | 2.5D layers with `rotateX/Y`, drop shadows, fold masks | Houses, the filter machine, the rocket |
| **Glass** | Black void, edge light, hairline glow | Existing void scenes | Product moments |
| **Screens on paper** | A real screen recording inside a drawn laptop or phone | Recording composited into a pencil device frame, lines wobble slightly around it | Design file, Xcode, Simulator, App Store Connect |
| **Characters** | Maya, her family, Sam: continuous-line portraits, no faces filled in, one accent detail each | SVG line art, animated by redrawing between poses (like a flipbook) | The human side of the story |
| **Data in graphite** | Charts and tables that draw themselves, numbers that roll | Remotion components fed by real data files | Research, the build, the reveal |

## The three voices (recorded or synthesized on the laptop)

| Voice | Who | Sound and treatment |
| --- | --- | --- |
| **FOUNDER** | Cassian, first person. The why | Close, dry, centred. Recorded on the MacBook mic in a quiet room with a blanket over your head, or a cloned voice of yours |
| **MAKER** | The builder. The how: data, design, code | Slightly brighter EQ, a touch of room. Second take of you in a faster register, or a synthetic voice clearly labelled in the credits |
| **MAYA** | Fictional user. Looks after her dad, her two kids, and her best friend Sam's papers while he works abroad | Warm, softer, a little reverb as if in a kitchen. Synthetic voice or a friend's recording. Paired with her line-drawing character |

Each voice owns a colour of pencil line on screen while it speaks: FOUNDER graphite, MAKER the accent colour, MAYA a warm sepia. The viewer always knows who's talking without names on screen.

## Chapter map

| # | Chapter | Time | The paper becomes |
| --- | --- | --- | --- |
| 1 | The line | 0:00 | A single line that becomes Maya's house |
| 2 | Maya's house | 0:30 | A paper pop-up house full of papers |
| 3 | The no | 1:15 | Two letters, a pair of scissors, an engine |
| 4 | The filter machine | 1:55 | A paper machine with five gates |
| 5 | The research board | 2:50 | A corkboard of pins and string |
| 6 | The name and the look | 3:55 | A drawn MacBook; the design file inside it |
| 7 | The engine room | 4:50 | A cutaway of the phone, with Xcode inside |
| 8 | The launch | 6:05 | A paper rocket and a map |
| 9 | The village | 6:55 | One house becomes a whole village of binders |
| 10 | Paper to glass | 8:10 | The village lifts off into the glass void |
| 11 | Provided for | 9:30 | Back to the pencil |

---

## 1. The line (0:00 - 0:30)

**0:00** Black. A pencil tip touches white paper; the sound of graphite.
**0:01** A single line starts drawing left to right. The camera follows it, close.
SUPER (written by the line itself, in handwriting, then resolving to DM Sans): *Every app starts as a line.*

**0:07** The line dips and climbs, drawing in passing: a heart rate, a calendar grid, a passport, a key. Each holds for half a second as a quick sketch, then the line moves on.
FOUNDER: This is the story of one app. From a no, to a launch, to a binder for everyone you call family.

**0:18** The camera pulls back fast: the line is one stroke on a gigantic sheet. Far across it we glimpse every chapter as a tiny sketch: a house, letters, a machine, a board, a laptop, a rocket, a village.
SUPER: *Provisum 2. How it was made, and why.*

**0:26** Dive back in. The line turns a corner and draws the outline of a house.

## 2. Maya's house (0:30 - 1:15)

**0:30** The house outline folds up off the page: a paper pop-up house, front wall open like a dollhouse. Inside, on the kitchen table, paper cutouts: letters, a school form, a passport, an insurance card, a box labelled *Sam's papers*.

**0:34** Maya appears, a continuous sepia line, sitting at the table. She doesn't have a filled face, just a few confident strokes.
MAYA: Some weeks I'm the mom, the daughter, and the one who knows where everything is.

**0:41** Each paper on the table lifts and flies up into the air around her as she names it, labelling itself in the lower third.
MAYA: My dad's insurance. The kids' passports. And Sam's car registration, because he's in Lisbon for a year and I'm the one he trusts.

**0:52** The papers orbit her faster, overlapping, a small storm. Her line wobbles.
SUPER: *Every family has someone who holds it together.*

**0:58** The storm freezes. The camera pulls back out of the house; above it, the papers rearrange into a family tree: Dad, Leo, Mia, Maya, her partner, the dog. Then a dotted branch draws itself out to a small paper plane labelled *Sam, Lisbon*.
SUPER: *And every family is bigger than its tree.*
FOUNDER: We wanted to build something for her. But first, we had to fail at something else.

**1:10** The pencil line leaves the house and runs to the next region.

## 3. The no (1:15 - 1:55)

**1:15** Two letters draw themselves on the paper. "Rejected" circles itself on each. Number roll: **4.3(a)**, *Design - Spam.*
FOUNDER: Our first app was turned down twice. It wasn't different enough. Apple was right.

**1:25** The letters crumple themselves into a ball. The ball unfolds into a cutaway drawing of an engine: gears labelled *storage*, *sync*, *reminders*, *export*.
SUPER: *Keep the engine. Find a new reason.*
FOUNDER: So we stopped resubmitting and held on to the one thing that was good.

**1:35** A pair of paper scissors cuts the drawing in two. The engine slides one way, labelled *keep*. The old name, the old idea and the old purpose slide the other way and fade, blurred so nothing is legible.

**1:43** A calendar page drops in, 21 circled. Number roll: *21 September 2026.*
FOUNDER: On the twenty-first of September, we started again.

**1:51** The engine is carried along the pencil line to the next region.

## 4. The filter machine (1:55 - 2:50)

**1:55** A paper machine folds up off the page: a tall contraption with a hopper on top and five gates down its front, like a marble run.
MAKER: Before we had one idea, we built the filter that every idea had to pass.

**2:02** Paper idea cards rain into the hopper, each with a blurred title. They tumble down. At each gate the gate's label writes itself, and most cards get stopped with a small red stamp:
1. *Useful for years, not for a week*
2. *Not something the iPhone already does*
3. *Private: no account, no tracking*
4. *Buildable in six to eight weeks*
5. *Free to start, paid to unlock*

MAKER: Useful for years. Not something the phone already does. Private by design. Buildable in weeks, not years. And a business from day one.

**2:30** A pile of stopped cards at the bottom; a single card drops out of the machine's last gate into a paper tray. It unfolds: *A binder for the one who holds the family's papers.*
FOUNDER: One idea made it through all five. We started with the hardest version: looking after a parent.

**2:42** The card flies back to Maya's house in the distance; the camera glimpses her looking up. Then it follows the pencil line on.

## 5. The research board (2:50 - 3:55)

**2:50** A corkboard draws itself, detective style: pins, red string, cards.
MAKER: Next, we stopped guessing.

**2:54** Cards pin themselves one by one, each with a source label and a small screen recording playing inside a drawn frame:

| Card | Inside the frame | Super |
| --- | --- | --- |
| The store | Scrolling App Store search results | *Does it already exist?* |
| The suggestions | A terminal listing App Store search suggestions | *What do people really type?* |
| The reviews | One-star reviews scrolling, names blurred | *What do the others get wrong?* |
| The rules | A state form, a Medicare page, an FTC page | *Who publishes the real rules?* |

MAKER: We searched the store like a tired person at eleven at night. We read the one-star reviews. And every form and rule in the app comes from whoever publishes it. States, Medicare, the FTC.

**3:20** Red string connects the cards and pulls tight. Where the strings cross, a 2x2 chart draws itself on the board: X *Organises the family*, Y *Handles the hard stuff*. Competitor dots appear as blank pins along the edges. The top-right corner is empty. A pencil circles it.
SUPER: *The gap: all of it, for everyone, privately.*

**3:35** The board's papers peel off and fold into six labelled paper boxes: Documents, Dates, Bills, People, Emergency card, Packets.
SUPER: *Six building blocks. Everything else hangs off them.*
MAKER: Six building blocks. Everything the app does is one of them, or a mix of them.

**3:48** The six boxes stack onto a paper hand truck and roll along the pencil line.

## 6. The name and the look (3:55 - 4:50)

**3:55** A sheet of crossed-out names. *On Behalf* gets the last line.
FOUNDER: For a few days it was called On Behalf. Then we found a better word.

**4:00** PROVISUM writes itself in pencil. Below, smaller: *Latin. "Provided for."* The pencil letters lift, gain weight and settle as the logotype.
FOUNDER: Provisum. Latin for provided for. What you want everyone you love to be.

**4:08** The pencil draws a MacBook in perspective, generic, no logo. On its screen, a real recording of the design file fades in, zoomed far out: every Provisum screen at once, like a city at night.
MAKER: Then the look. Calm, because people open this app on hard days.

**4:15** The camera dives into the screen. Inside the recording, a sequence, each with a super:
- Colour tokens, light and dark. *One accent. Nothing shouts.*
- The nine wallpapers slide past, then spread out like paint swatches. *Every person gets their own colour.*
- A form screen; a pencil stroke crosses it out over the recording; a conversation screen slides in. *Ask one question at a time.*
- The emergency view jumps to the largest text size. *Readable on the worst night of your life.*
- Version history scrubs: dozens of home screens flick by and settle. *Dozens of versions. One home screen.*

MAKER: Every screen was checked at the biggest text sizes. When something broke, we redesigned the screen, not the text.

**4:45** Camera pulls back out of the laptop; the drawn laptop folds flat back into the paper. The line continues.

## 7. The engine room (4:50 - 6:05)

**4:50** A big phone outline is drawn, then sliced open like a technical cutaway: floors, like a building. Each floor is labelled.
MAKER: Native Swift, for iPhone, Apple Watch and widgets. Nothing in between.

**4:56** The top floor: a drawn laptop again, with a real Xcode recording inside. The project navigator unfolds: Binder, Documents, Deadlines, Packets, EmergencyCard, Family, Visits. Each folder name pops out of the screen as a paper tab and pins itself to the cutaway.
SUPER: *Every feature has its own room.*

**5:06** Middle floor: the data model. A paper **Binder** in the centre; strings run from it to the six boxes from chapter 5.
MAKER: Everything belongs to a binder, and a binder belongs to a person: your dad, your daughter, yourself, your partner, a friend, even the dog.
SUPER: *One person. Everything that belongs to them.*

**5:18** A small paper train runs through the floor: three carriages (a passport expiry, a bill, an appointment) merge onto one track.
MAKER: Every date from every source joins one list and gets the reminder that fits it. Passports get nine, six and three months. A bill gets the day before.
SUPER: *All the dates. One list. The right reminder.*

**5:32** Bottom floor: the vault. The phone's floor connects by a pipe to a cloud labelled *Your own iCloud*, and through it to two more phones labelled *Your brother* and *Sam*. Off to the side, a drawn server box labelled *Veyago server*: the pencil draws it, then erases it completely.
MAKER: There is no Veyago server. Your data lives on your phone and in your own iCloud. Sharing goes straight to the people you invite.
SUPER: *No server. No account. Data Not Collected.*

**5:46** The emergency card slides into a small safe; a padlock snaps shut.
MAKER: The emergency card is encrypted on your iPhone before it goes anywhere.

**5:52** Back up to the top floor: Xcode tests run, a column of green ticks scrolls inside the drawn laptop, a number roll counts the passing tests. Build succeeded; the Simulator boots inside a drawn phone.
FOUNDER: We carried the engine over from our first app, and rebuilt everything around it.

**6:02** The cutaway closes like a book.

## 8. The launch (6:05 - 6:55)

**6:05** A paper rocket folds up on a launchpad. On its side, the status from App Store Connect, recorded and composited as a label that changes: *Waiting for Review*, *In Review*, *Ready for Distribution*.
FOUNDER: And App Review said yes.

**6:15** The rocket launches up the paper and arcs over a drawn world map. It lands only on the United States, which fills with colour. The rest stays pencil outline.
SUPER: *United States first. On purpose.*
FOUNDER: We launched in the United States, where Veyago does business, with its states' forms and Medicare built in.

**6:27** A red sticky note slaps onto the US: *Listed as paid. Should be free.* The pencil crosses it out; a new note: *Fixed. Version 1.1. Next day.*
SUPER: *Day one: a mistake. Day two: fixed.*
FOUNDER: On day one we got the price wrong. On day two we fixed it.

**6:40** Zoom into the US until only a single house is in frame: Maya's house again, now with Provisum's tab for *Dad* glowing in the window.
FOUNDER: Then we looked at what we'd built, and at who we'd left out.
**6:50** Maya, in the window.
MAYA: It was never only my dad.

## 9. The village (6:55 - 8:10)

**6:55** The camera pulls back. Beside Maya's house, more paper houses pop up, one by one, each with its own wallpaper colour and a name on the door: *Leo*, *Mia*, *Maya*, *Jonas* (her partner), *Biscuit* (the dog, a kennel), and far away across a paper sea, a small flat labelled *Sam, Lisbon*. Dotted string connects them all.
SUPER: *Version 2: a binder for everyone you call family.*
FOUNDER: Version one was a binder for a parent. Nobody looks after just one person.

**7:08** The camera flies house to house. Each house opens its front wall for three seconds to show one new feature, drawn, with a margin note, and Maya's line in sepia in the doorway:

| House | Inside | Super |
| --- | --- | --- |
| Leo and Mia | Two passports on a fridge, ticks at 9, 6, 3 months | *IDs for everyone, reminded early.* |
| Dad | A Watch on a bedside table, a Wallet pass beside it | *The emergency card on the wrist and in Wallet.* |
| Dad | A pill bottle, a small bell | *Medication list, with refill reminders.* |
| Maya | Three phones around one card, padlock | *Share the card. Encrypted first.* |
| Jonas | Coins splitting between three figures | *Who paid what.* |
| Maya | An envelope, a circled question mark | *Is this letter a scam?* |
| Dad | A sound wave over a doctor's desk | *Record the visit. Keep it on the phone.* |
| Biscuit's kennel | A vet card in a tiny folder | *Pets get a binder too.* |
| Sam, Lisbon | A key, a car registration, a lease | *Look after a friend's papers while they're away.* |

MAYA (over the flight): Sam's car, Dad's medications, the kids' passports. Same place. Same calm.

**7:45** The camera rises high above the village. The paper sea turns into a map of Europe; four countries light up in pencil: Belgium, the Netherlands, Germany, France. *112* and *A4* write themselves in the margin. Speech bubbles float up from the houses: Hello, Hola, Hallo, Bonjour, Hoi.
SUPER: *Five countries. Five languages.*

**7:58** A form drawn on the village green is crossed out with one stroke; a conversation bubble appears with one question and two chips.
MAKER: And the biggest change: no more forms. Provisum asks one question at a time.

## 10. Paper to glass (8:10 - 9:30)

**8:10** Every line in the village begins to glow. The paper texture fades to black. The houses lift off as hairlines of light and fold inward into a single phone outline.

**8:18** The phone gains depth, rotates slowly in the void, edge light sweeping. The village's elements snap into real screens in the order the houses were visited, on the beat, each with a one-line label.

**8:35** The phone splits into a row of phones, one per binder, each wearing its house's wallpaper colour: Dad, Leo, Mia, Maya, Sam.
SUPER: *Every person. Their own binder. Their own colour.*
MAKER: Every person gets the documents, dates and packets that fit them. A child's binder isn't a parent's.

**8:46** The emergency card flips onto a Watch; a Wallet pass slides out behind.
SUPER: *Apple Watch. Apple Wallet.*

**8:52** Number rolls on black, one second each: *6 kinds of people* / *5 countries* / *5 languages* / *0 servers*.

**8:58** Real Simulator recordings, 1.5 s each, labelled: inviting a friend to a binder, the family view showing who joined, shared costs, a passport reminder, the scam note, a visit summary, a Belgian binder calling 112, the first onboarding question.
FOUNDER: Everything we drew.
MAKER: Built natively. Tested at every text size.
MAYA: And it's all on my phone. Not on anyone's server.

**9:10** Inside the void, a tiny line drawing of Maya appears beside the phone and taps *Invite*. A paper plane leaves her hand and flies across the black to a small hairline-lit phone far away: *Maya invited you to "Sam".*
SUPER: *Share a binder with anyone you trust.*

**9:18** Black. One second of silence.

**9:20** **Provisum**, then a single pencil stroke writes **2**.
SUPER: *A binder for your whole family. And the friends who are family.*

## 11. Provided for (9:30 - 10:00)

**9:30** The glow fades back into graphite. We are on the paper again, pulling back and back: the whole endless sheet is visible for the first time, every chapter as one drawing joined by the single unbroken line.
SUPER: *A no. Five filters. One idea. A whole village.*

**9:42** The line's end leads to a real pencil, drawn, lying on the paper. It sets itself down.
FOUNDER: Provisum. It's Latin for provided for. For everyone you call family.

**9:50** End card on paper: *Provisum 2* / *Free on the App Store* / the Veyago mark. In Cambria: *Made by Veyago. Private by design.*

**9:58** Pencil click. Cut.

---

## Build plan in Remotion

| Component | What it does | Reused in |
| --- | --- | --- |
| `<EndlessSheet>` | One giant canvas with all chapter layers at fixed coordinates; one camera with keyframed x, y, zoom | Whole film |
| `<PencilLine>` | The unbroken line; a single long SVG path revealed by frame | Whole film |
| `<PopUp>` | Lifts a flat drawing into a 2.5D paper object with fold and shadow | House, machine, rocket, village |
| `<LineCharacter>` | Maya and family as SVG line art; swaps between poses with a redraw | Ch. 2, 8, 9, 10 |
| `<ScreenOnPaper>` | Drawn laptop or phone frame with a video clip masked inside | Ch. 5, 6, 7, 8, 10 |
| `<NumberRoll>` | Odometer digits in the accent colour | Throughout |
| `<FilterMachine>` | Hopper, five gates, falling cards with physics-ish easing | Ch. 4 |
| `<StringBoard>` | Cork, pins, string tightening, 2x2 forming at the crossing | Ch. 5 |
| `<Cutaway>` | A phone sliced into floors; camera moves floor to floor | Ch. 7 |
| `<Village>` | Houses popping up with wallpaper colours and door labels | Ch. 9 |
| `<InkToLight>` | Existing: graphite glows, paper fades to black | Ch. 10 |

Recordings to capture on the laptop: the design file (overview, tokens, wallpapers, form vs conversation, largest text, version history), Xcode (navigator, tests, build), the Simulator (eight feature moments, the onboarding question), App Store Connect status labels, App Store search results, the terminal suggestion list, one-star reviews (blurred), official forms.

## Voice totals

| Voice | Approx. words | Approx. time |
| --- | --- | --- |
| FOUNDER | 290 | 2:10 |
| MAKER | 330 | 2:20 |
| MAYA | 110 | 0:50 |

About 4:40 of the film is carried by music, sound and supers, with the camera always moving along the line.

## Open decisions

- [ ] **Synthetic voices.** If MAKER or MAYA is generated, say so in the end credits ("Voices of Maker and Maya are synthetic"). It is honest and avoids a backlash in the comments.
- [ ] **Apple software on screen.** Xcode, the Simulator and App Store Connect show Apple's typefaces and icons. `CONTRACT.md` currently forbids that; amend it to allow genuine screen recordings of developer tools inside the drawn frames, or recreate those moments as drawings.
- [ ] **The first-app story** stays public and unnamed; Apple's warning about the account stays out.
- [ ] **Sam and the friend binder.** The promise "the friends who are family" is the film's last line. Make sure the 2.0 onboarding and listing use the same words.
