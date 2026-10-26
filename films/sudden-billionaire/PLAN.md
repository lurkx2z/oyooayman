# Would you actually be generous if you suddenly became a billionaire? — plan

Voiceless 16:9 long-form (1920×1080, 30 fps), the Slower light / Time on your feet formula: on-screen captions, a
readout that never stops moving, an honest label on every study, a synthesised score. Psychology, not physics: what
the research says sudden money and power do to people, told as your own story over ten years. ~7:40.

Page `sudden-billionaire.html`, code `films/sudden-billionaire/` (prefix `sb` / `SB`), captions `CAPTIONS.md` →
`build-timing.cjs` → `timing.js`. Branch `claude/project-thread-wtqa0u`.

## 1. The film in one breath

Cold open: ten years from now, night, rain, your expensive car. A woman waits at a zebra crossing and you roll
straight through; your eyes are on your phone. Title. Then the story from the start: Saturday night, $412 in your
account, one lottery ticket, the biggest jackpot ever. You win a billion dollars after tax and write a promise on a
sticky note: *give half away*. Day one feels wonderful (you pay off your mum's house). Then everyone wants some, you
stop trusting anyone, and the money makes money in your sleep. The house, the car, the neighbours keeping up, breakfast
that stops tasting special, wanting more, wanting to be ahead. Power: the company, the cookie study, the rigged
Monopoly game, the children's sweets, your politics. The yacht and the bigger yacht; a wall, a gate, a guard. Downtown
you stop looking at people; in the car you stop stopping. You give, a little, while the readout climbs. In year nine
you find the note: half would now be $627 million. The real billionaires' pledge; then the honest part (your story
is made up, some studies were small or failed), the counter-evidence (richer homes returned more lost letters), the
46-second video, Chuck Feeney. The same crossing ten years on: this time you stop, and you see her. *So, be honest.
Would you give half away?*

**The readout (top left):** YOUR MONEY, to the cent, ticking with interest (5% a year = $137,000 a day = $1.59 a
second), every purchase shown as it leaves; under it GIVEN AWAY x% · PROMISED 50%; then NEXT · … so something is
always coming. It goes $412.37 → $1,000,000,412.37 → $1.30 billion; given away reaches 2.4%. Top right: WHEN/WHERE
(day one … year ten, or the study's place and year).

## 2. Every number, and where it comes from

Story (made up, labelled ILLUSTRATION · YOUR STORY IS MADE UP): the jackpot, the win, the purchases and gifts. The
money model is `money.js`: $1,000,000,412.37 earning 5% a year, compounded continuously (a typical long-run return for
a large mixed portfolio: an assumption, said in this plan), minus each purchase and gift at the moment you see it, and
running costs (staff and upkeep $6M a year from month two, the yacht's upkeep $7M a year, security $2M a year, gala
cheques $1M a year). The house $28M, the car $420k, the yacht $70M (60 m superyachts cost roughly this; upkeep is
commonly put at ~10% of the price a year), the wall/gate/guard $3M; gifts: your mum's mortgage $310k, your friend's
debts $64k, $10M (a hospital wing), $5M (a school). Computed: $1,300,954,8xx at year ten; given away 2.44% of the
billion; half at year nine $626.7M → the caption says **$627 million**.

The jackpot: the record real US jackpot is $2.04 billion (Powerball, 7 Nov 2022; cash option $997.6M before tax). Your
story's "biggest jackpot in history" is a new, bigger one: $3.4 billion advertised → about $1.66 billion as cash →
about $1.0 billion after 37% federal tax (in a state with no lottery tax). The TV shows "$3.4 BILLION"; the HUD says
CASH, AFTER TAX.

Scale: 1,000,000,000 s = 31.7 years ("31 years"). Ten million $100 notes: each 156 × 66.3 × 0.11 mm → 11.4 m³; on the
flat's 3.3 × 2.6 m floor that is 1.33 m deep (chest height). Each note weighs about 1 g → 10 tonnes. $137,000 a day
= 5% of $1B / 365. A caption shown for 3.25 s at $1.585/s → $5.15 ("you've made $5").

| Beat | Claim on screen | Source | Label on screen |
| --- | --- | --- | --- |
| dunn | People given $5 or $20 to spend on others were happier by evening than those told to spend it on themselves | Dunn, Aknin & Norton 2008, *Science* 319:1687. Registered replication (Aknin et al. 2020, *PLoS ONE*): mixed; supports a smaller effect, sensitive to method | REAL STUDY · 2008 · REPEATED 2020: SMALLER EFFECT |
| neighbours | In Canada, each $1,000 a neighbour won raised nearby bankruptcy risk by 2.4% | Agarwal, Mikhed & Scholnick 2020, *Review of Financial Studies* 33(1) ("Peers' income and financial distress: evidence from lottery winners and neighboring bankruptcies"); wins up to $150k; neighbours also bought more visible goods (cars). Dutch Postcode Lottery: neighbours of winners bought more cars (Kuhn et al. 2011, *AER*) | REAL STUDY · CANADA · SMALL WINS, UNDER $150,000 |
| brick | 1978: 22 lottery winners rated everyday pleasures (talking with a friend, TV, breakfast, a joke, a compliment, a magazine, buying clothes) 3.33 vs 3.82 for controls; overall happiness not significantly different (4.00 vs 3.82) | Brickman, Coates & Janoff-Bulman 1978, *JPSP* 36:917 | REAL STUDY · 1978 · 22 WINNERS (SMALL) |
| brick | Big winners in Sweden were more satisfied with life over 10+ years later | Lindqvist, Östling & Cesarini 2020, *Review of Economic Studies* 87:2703 (~3,300 players, prizes up to ~$1M+); life satisfaction up and lasting; happiness and mental health not clearly changed | REAL STUDY · SWEDEN · 2020 · 3,300 PLAYERS |
| enough | 4,000+ millionaires asked what would make them a "perfect 10": most said 2 to 10 times what they had | Donnelly, Zheng, Haisley & Norton 2018, *PSPB* 44:684 (n = 4,155): 23.2% said 100% more, 24.5% 500% more, 26.8% 1,000% more (~75% in 2–10×) | REAL SURVEY · 2018 · 4,155 MILLIONAIRES |
| compare | $50k while others earn $25k, or $100k while others earn $200k: about half chose the first | Solnick & Hemenway 1998, *J. Economic Behavior & Organization* 37:373 (Harvard School of Public Health, 257 students, faculty, staff); reported as ~50% (48–52% depending on the summary) | REAL SURVEY · 1998 · 257 PEOPLE AT HARVARD |
| cookies | Groups of three; one put in charge at random; a plate of five cookies; the leader more often took the 4th (extra) cookie and ate with their mouth open | Ward & Keltner 1998, unpublished; described in Keltner, *The Power Paradox* (2016) and Keltner, Gruenfeld & Anderson 2003, *Psych. Review* | UNPUBLISHED LAB STUDY · BERKELEY · 1998 |
| game | Rigged Monopoly: 100+ pairs of strangers, a coin flip made one rich (2× money, 2× salary, two dice vs one); rich players smacked the board, ate more pretzels, credited their skill | Paul Piff, TED talk "Does money make you mean?" (2013) and PBS NewsHour; not published as a paper | A TALK, NOT A PUBLISHED PAPER · 2013 |
| candy | People led to feel richer took about twice as much candy meant for children (1.17 vs 0.60 pieces) | Piff, Stancato, Côté, Mendoza-Denton & Keltner 2012, *PNAS* 109:4086, study 5 (critiqued: Francis 2012, "too good to be true" set of results) | REAL STUDY · 2012 · SMALL · LATER CRITICISED |
| views | Bigger UK lottery wins → people moved right and more often agreed ordinary people get a fair share | Powdthavee & Oswald 2014, *J. Public Economics* 112:31 (British Household Panel Survey) | REAL STUDY · BRITAIN · 2014 |
| glass | 61 New Yorkers wore Google Glass for one block; higher social class → less time looking at passers-by (two lab eye-tracking studies and an online study agreed) | Dietze & Knowles 2016, *Psychological Science* 27:1517 | REAL STUDY · 2016 · 61 PEOPLE |
| drive | Crossing in Berkeley: the highest-status cars failed to yield to a pedestrian 46.2% of the time (6 of 13); the lowest 0% (0 of 5) | Piff et al. 2012, *PNAS*, study 2 (152 drivers in all) | REAL STUDY · 2012 · ONLY 5 CHEAP CARS WATCHED |
| pledge | 2010: 57 original US Giving Pledge signers; 2025: the 32 still billionaires are 283% richer (166% after inflation); much giving went to private foundations (80% of the $206B traced, often the giver's own); of the 22 who died, 8 met the pledge | Institute for Policy Studies, "The Giving Pledge at 15" (Aug 2025), Collins & Flannery | REAL · INSTITUTE FOR POLICY STUDIES · 2025 |
| real | Some studies small, some failed when repeated | Piff et al. 2010 "lower class gave more" failed two preregistered replications (Stamos et al. 2020); power and perspective-taking ("E on forehead", Galinsky et al. 2006) failed in Many Labs 3 (Ebersole et al. 2016); Dunn's replication smaller; candy/crossing samples small | (the board of study cards) |
| letters | 360 envelopes misdelivered in a Dutch city: high-SES homes returned 81%, low-SES 38% | Andreoni, Nikiforakis & Stoop 2021, *Nature Communications* 12:3733 | REAL FIELD EXPERIMENT · NETHERLANDS · 2021 |
| letters | Big surveys: richer people give and help more | Korndörfer, Egloff & Schmukle 2015, *PLoS ONE* 10:e0133193 (eight large representative samples, Germany and US) | REAL · LARGE SURVEYS |
| letters | …but a smaller share of what they have | Chronicle of Philanthropy, "How America Gives" 2012 (2008 IRS data): households earning $50–75k gave 7.6% of discretionary income, $100k+ gave 4.2% | REAL · US TAX DATA 2008 |
| video | A 46-second video about child poverty made upper-class participants as helpful as lower-class ones | Piff, Kraus, Côté, Cheng & Keltner 2010, *JPSP* 99:771, study 4 (the same paper whose main result failed to replicate in 2020) | REAL STUDY · 2010 · ITS MAIN RESULT LATER FAILED TO REPEAT |
| feeney | Chuck Feeney (Duty Free Shoppers): gave away over $8 billion, for years in secret (revealed 1997); ~$2M left for himself and his wife; a rented San Francisco flat; a ~$10 Casio watch; died 9 Oct 2023, aged 92 | Atlantic Philanthropies; *Forbes* 2012/2020; *New York Times* obituary 2023 | REAL PERSON · ILLUSTRATED |

Not used (checked, too weak or contested): Hogeveen 2014 (power and motor resonance, n = 45); "E on forehead" as a
finding (failed to replicate; used only as an example of failure); Hankins et al. lottery bankruptcy summaries
(conflicting); Killingsworth, Kahneman & Mellers 2023 (happiness and income) kept out for length.

Honest limits said on screen: your story is made up; the cookie study and the Monopoly game are unpublished; the
crossing study watched only 5 cheap cars; some findings failed to repeat; the opposite evidence (letters, big surveys)
is shown; Feeney is the counter-example, not proof.

## 3. Shots and places

`shots.js` lists every shot (37) with its set and mode. Sets: **car** (your car at a zebra crossing: night rain for the
cold open and the ending; daylight for year three), **flat** (the studio flat: TV draw, the cash to your chest, the
sticky note on the fridge, the phone, the peephole, the bed at night; Feeney's flat is the same flat, by day, almost
bare), **house** (a glass house on a hill: hall, kitchen island, terrace over the city, the TV, the gate and wall, the
garage and the box from the old flat; the night window for the pledge), **street** (your old street by day, downtown
with camera-glasses gaze, a Dutch street with letters), **lab** (a glass boardroom; the study room: Dunn's envelopes,
the cookies, the Monopoly-style board, the sweets, the laptop, the board of study cards), **sea** (a marina at sunset:
your 60 m yacht, the 120 m one beside it).

People are the shared stylised rig (no faces). Your hands are the shared ViewerHands with this film's poses (phone,
ticket, pen, wheel, remote, cookie, dice).

## 4. Sound

Synthesised (sound-music.js, sound-amb.js, sound-sfx.js), baked to soundtrack.js. A small piano "promise" motif (heard
when you write the note, when you find it, and when you stop at the crossing); strings and a pulse that grow colder
and busier as the money grows; rain and wipers; the TV draw; phone buzzes that become a swarm; a soft coin tick for the
interest; cash rustle; the gala; footsteps in empty rooms. Targets −16 to −14 LUFS, ≤ −1 dBTP, a real loudness range.

## 5. Delivery

`/mnt/project-files/sudden-billionaire/`: EPISODE_REPORT.md, the runnable ZIP, thumbnails. Final render on the owner's
PC (`render-gpu.cjs --channel chrome`) to `D:\renders\sudden-billionaire\` (1080p + a phone copy under 30 MiB).

## 6. Reviews

(filled in after the preview)
