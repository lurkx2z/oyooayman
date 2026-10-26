# Would you actually be generous if you suddenly became a billionaire? — plan

Voiceless 16:9 long-form (1920×1080, 30 fps), the Slower light / Time on your feet formula: on-screen captions, a
readout that never stops moving, an honest label on every study, a synthesised score. Psychology, not physics: what
the research says sudden money and power do to people, told as your own story over ten years. 7:52.

Page `sudden-billionaire.html`, code `films/sudden-billionaire/` (prefix `sb` / `SB`), captions `CAPTIONS.md` →
`build-timing.cjs` → `timing.js`. Branch `claude/project-thread-wtqa0u`.

## 1. The film in one breath

Cold open: ten years from now, night, rain, your expensive car. A woman waits at a zebra crossing and you roll
straight through; your eyes are on your phone. Title. Then the story from the start: Saturday night, $412 in your
account, one lottery ticket, the biggest jackpot ever. You win a billion dollars after tax and write a promise on a
sticky note: *give half away*. Day one feels wonderful (you pay off your mum's house). Then everyone wants some, you
stop trusting anyone, and the money makes money in your sleep. The house, the car, the neighbours keeping up, breakfast
that stops tasting special, wanting more, wanting to be ahead. Power: the company, the cookie study, the rigged
Monopoly game, a magazine that calls you self-made, your politics. The yacht and the bigger yacht; a wall, a gate, a guard. Downtown
you stop looking at people; in the car you stop stopping. You give, a little, while the readout climbs. In year nine
you find the note: half would now be $627 million. The real billionaires' pledge; then the honest part (your story
is made up, some studies were small or failed, the crossing study among them), the counter-evidence (richer homes
returned more lost letters, though just after payday poorer homes returned almost as many; the surveys disagree on the
share), MacKenzie Scott (made suddenly rich by a divorce, she
gave $26 billion away), Chuck Feeney. The same crossing ten years on: this time you stop, and you see her. *So, be honest.
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

Scale: 1,000,000,000 s = 31.7 years ("almost 32 years"). Ten million $100 notes: each 156 × 66.3 × 0.11 mm → 11.4 m³; on the
flat's 3.3 × 2.6 m floor that is 1.33 m deep (chest height). Each note weighs about 1 g → 10 tonnes. $137,000 a day
= 5% of $1B / 365. A caption shown for 3.25 s at $1.585/s → $5.15 ("you've made $5").

| Beat | Claim on screen | Source | Label on screen |
| --- | --- | --- | --- |
| dunn | That feeling is real, though smaller than first thought: people given $5 or $20 to spend on others were happier by evening than those told to spend it on themselves | Dunn, Aknin & Norton 2008, *Science* 319:1687 (46 people). A close repeat of this exact study (Kim et al. 2022, *PLoS ONE*, 133 people) found no difference on the original analysis but one on a more direct measure; Aknin et al. 2020 (*JPSP*, 7,861 people) found a small effect that depended on method | REAL STUDY · 2008 · 46 PEOPLE · REPEATS: SMALLER, MIXED |
| neighbours | In Canada, the bigger someone's lottery win, the more of their neighbours went bankrupt in the next two years (the HUD: +2.4% risk per C$1,000, from the 2016 working-paper draft; the published paper reports elasticities) | Agarwal, Mikhed & Scholnick 2020, *Review of Financial Studies* 33(1) ("Peers' income and financial distress: evidence from lottery winners and neighboring bankruptcies"); wins up to $150k; neighbours also bought more visible goods (cars). Dutch Postcode Lottery: neighbours of winners bought more cars (Kuhn et al. 2011, *AER*) | REAL STUDY · CANADA · 2020 · WINS UNDER C$150,000 |
| brick | 1978: 22 lottery winners rated everyday pleasures (talking with a friend, TV, breakfast, a joke, a compliment, a magazine, buying clothes) 3.33 vs 3.82 for controls; overall happiness not significantly different (4.00 vs 3.82) | Brickman, Coates & Janoff-Bulman 1978, *JPSP* 36:917 | REAL STUDY · 1978 · 22 WINNERS (SMALL) |
| brick | Big winners in Sweden were still more satisfied with life 5 to 22 years later | Lindqvist, Östling & Cesarini 2020, *Review of Economic Studies* 87:2703 (~3,300 players, prizes up to ~$1M+); life satisfaction up and lasting; happiness and mental health not clearly changed | REAL STUDY · SWEDEN · 2020 · 3,300 PLAYERS |
| enough | 2,000 millionaires asked how much more would make them perfectly happy; of those not already very happy, three in four said 2 to 10 times more | Donnelly, Zheng, Haisley & Norton 2018, *PSPB* 44:684. The "perfect 10" question was Study 2 only: 2,026 millionaires in 17 countries; the 887 not already at 9–10 answered it: 23.2% said 100% more, 24.5% 500% more, 26.8% 1,000% more (~75% in 2–10×). (4,155 is both studies together.) | REAL SURVEY · 2018 · 887 ANSWERED THIS |
| compare | $50k while others earn $25k, or $100k while others earn $200k: about half chose the first | Solnick & Hemenway 1998, *J. Economic Behavior & Organization* 37:373 (Harvard School of Public Health, 257 students, faculty, staff); reported as ~50% (48–52% depending on the summary) | REAL SURVEY · 1998 · 257 PEOPLE AT HARVARD |
| cookies | Groups of three; one put in charge at random; a plate of five cookies; the leader more often took the 4th (extra) cookie and ate with their mouth open | Ward & Keltner 1998, unpublished; described in Keltner, *The Power Paradox* (2016) and Keltner, Gruenfeld & Anderson 2003, *Psych. Review* | UNPUBLISHED LAB STUDY · BERKELEY · 1998 |
| game | Rigged Monopoly: 100+ pairs of strangers, a coin flip made one rich (2× money, 2× salary, two dice vs one); rich players smacked the board, ate more pretzels, credited their skill | Paul Piff, TED talk "Does money make you mean?" (2013) and PBS NewsHour; not published as a paper | A TALK, NOT A PUBLISHED PAPER · 2013 |
| genius | (your story) A business magazine puts you on its cover; you won a lottery, but you start to believe you earned it | A story beat that carries the Monopoly game's finding (the rich players credited their own skill) into your life. It replaced the sweets study (Piff et al. 2012, study 4: 1.17 vs 0.60 sweets) after the second review: small, criticised (Francis 2012), and from the same paper as the crossing study that failed to repeat | ILLUSTRATION · YOUR STORY IS MADE UP |
| views | In Britain, lottery winners drifted right; the bigger the win, the bigger the shift (and they more often said ordinary people get a fair share) | Powdthavee & Oswald 2014, *J. Public Economics* 112:31 (British Household Panel Survey); wins averaged about £220 (largest about £185k); significant mainly in men | REAL STUDY · BRITAIN · 2014 · MOSTLY SMALL WINS, MAINLY MEN |
| glass | 61 New Yorkers wore camera glasses for one block; the higher their (self-rated) class, the shorter they looked at people they passed (they looked as often, more briefly; 53 of the 61 were men) | Dietze & Knowles 2016, *Psychological Science* 27:1517 | REAL STUDY · 2016 · 61 PEOPLE · CLASS WAS SELF-RATED |
| drive | Crossing in Berkeley: the highest-status cars failed to yield to a pedestrian 46.2% of the time (6 of 13); the lowest 0% (0 of 5) | Piff et al. 2012, *PNAS*, study 2 (152 drivers in all). A preregistered direct replication at Berkeley-style crossings found no link (Jung, Smeets, Stoop & Vosgerau 2023, *JEP: General*, 394 drivers, r = .03); a 2020 Las Vegas study found a small effect (yielding odds fell ~3% per $1,000 of car value). The film says so: label, panel footnote, the board's FAILED TO REPEAT stamp, and the "real" caption | REAL STUDY · 2012 · SMALL · A 2023 REPEAT FOUND NO LINK |
| pledge | 2010: 57 original US Giving Pledge signers; 2025: the 32 still billionaires are 283% richer (166% after inflation); much giving went to private foundations (80% of the $206B traced, often the giver's own); of the 22 pledgers who have died (from any signing year, not only the 57; IPS: "Only 8 of the 22 deceased Pledgers fulfilled their pledges"), only 8 gave at least half, in life or through their estates; some estates are still being settled | Institute for Policy Studies, "The Giving Pledge at 15" (Aug 2025), Collins & Flannery (a campaigning think tank) | REAL · ESTIMATES BY A CAMPAIGNING THINK TANK (IPS) · 2025 |
| real | Some were small; some failed when repeated, like the crossing study | Jung et al. 2023 (the crossing); Piff et al. 2010 "lower class gave more" failed two preregistered replications (Stamos et al. 2020); power and perspective-taking ("E on forehead", Galinsky et al. 2006) failed in Many Labs 3 (Ebersole et al. 2016); Dunn's replication smaller; the crossing sample small | (the board of study cards) |
| letters | 360 envelopes with money inside (€5 or €20, as cash or a bank transfer card) misdelivered in a Dutch city: high-SES homes returned 81%, low-SES 38%; just after payday, low-SES homes returned almost as often as high-SES (the authors: financial pressure crowds out the ability to help, not character) | Andreoni, Nikiforakis & Stoop 2021, *Nature Communications* 12:3733 (payday finding as summarised by NYU Abu Dhabi, Aug 2021) | REAL FIELD EXPERIMENT · NETHERLANDS · 2021 |
| letters | Big surveys: richer people give and help more | Korndörfer, Egloff & Schmukle 2015, *PLoS ONE* 10:e0133193 (eight large representative samples, Germany and US) | REAL · LARGE SURVEYS |
| letters | Whether they give a bigger share is still argued over | One measure: Chronicle of Philanthropy, "How America Gives" 2012 (2008 IRS data, itemisers only): households earning $50–75k gave 7.6% of discretionary income, $100k+ gave 4.2%. Korndörfer 2015 found the opposite (higher class, a higher % of income). The panel shows both | REAL · LARGE SURVEYS · THEY DISAGREE ON THE SHARE |
| scott | In 2019 a divorce suddenly made MacKenzie Scott worth about $36 billion (a quarter of the couple's Amazon stake, about 4% of the company); since then she has given away $26 billion, unrestricted ("no strings attached"), to over 1,600 charities (the count published in 2022; the wall shows 1,664 envelopes), and is still worth about $33 billion (Forbes) | Her own essays (Yield Giving, Dec 2025: $26.3B since 2019, $7.1B in 2025); AP, Dec 2025; Forbes | REAL · HER OWN REPORTS, FORBES · ILLUSTRATED |
| feeney | Chuck Feeney (Duty Free Shoppers): gave away about $8 billion (Forbes: earned ~$7.5B; the $8B includes the foundation's growth), for years in secret (revealed 1997); kept about $2M (figure from 2016–2020); a rented San Francisco flat; a cheap watch (reported at $10–15); died 9 Oct 2023, aged 92 | Atlantic Philanthropies; *Forbes* 2012/2020; *New York Times* obituary 2023 | REAL · ILLUSTRATED |

Not used (checked, too weak or contested): Hogeveen 2014 (power and motor resonance, n = 45); "E on forehead" as a
finding (failed to replicate; used only as an example of failure); Hankins et al. lottery bankruptcy summaries
(conflicting); Killingsworth, Kahneman & Mellers 2023 (happiness and income) kept out for length.

Honest limits said on screen: your story is made up; the cookie study and the Monopoly game are unpublished; the
crossing study watched only 5 cheap cars and failed a 2023 repeat; some findings failed to repeat; the opposite
evidence (letters, big surveys, the share argument) is shown; MacKenzie Scott and Feeney are counter-examples, not
proof. The last line is hedged: "money may not decide who you become. But it can make it easier not to notice."

Dropped after the science review: the 46-second video study (Piff et al. 2010, study 4: students rating their own
class, small, and the gap it closed did not replicate), replaced by MacKenzie Scott, a real case close to the film's
premise ("one real woman's story began a lot like yours").

## 3. Shots and places

`shots.js` lists every shot (45) with its set and mode. Sets: **car** (your car at a zebra crossing: night rain for the
cold open and the ending; daylight for year three), **flat** (the studio flat: TV draw, the cash to your chest, the
sticky note on the fridge, the phone, the peephole, the bed at night; Feeney's flat is the same flat, by day, almost
bare), **house** (a glass house on a hill: hall, kitchen island, terrace over the city, the TV, the gate and wall, the
garage and the box from the old flat; the night window for the pledge; the magazine on the low table), **street** (your old street by day, downtown
with camera-glasses gaze, a Dutch street with letters), **lab** (a glass boardroom; the study room: Dunn's envelopes,
the cookies, the Monopoly-style board, the board of study cards; a dark hall with a wall of 1,664 envelopes for MacKenzie Scott), **sea** (a marina at sunset:
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

Three independent reviews of the 7:38 preview (2026-10-26), scores as given:

- **Retention:** hook 6, middle 4.5, clarity without narration 7, emotional payoff 5, overall 5.5. Biggest problems: the
  middle didn't escalate (nine studies in static rooms, the readout flat), the crossings (the film's spine) were thrown
  away, polish bugs (text collisions, clipped panels, picture/caption mismatches).
- **Science:** accuracy 6, caveats 6, balance 5, overall 6 ("about 8 if the fixes are made"). The crossing study failed
  a 2023 preregistered repeat; the pledge's 22 deaths are from all signers; the "perfect 10" survey numbers; the share
  of income claim; one lab carries most of the "money makes you worse" beats.
- **Visual:** image quality 6, composition 5, lighting/grade 6, staging 5, consistency 6, overall 5.5. Weakest: the
  12 s near-black interest shot, the woman too small at the crossings, the money as a flat tiled plane, the white
  house interiors, the terrace "pyramid", infographic cards standing in for pictures.

Fixed after them: every science wording and label (table above), the crossing replication on screen, the video beat
replaced by MacKenzie Scott (a wall of 1,664 envelopes lighting up); the crossings restaged (she is big, lit, on the
zebra, held; at the end she stops in your headlights and thanks you, and the readout goes for the first time); the
interest shot relit (the moonlit window on the ceiling, the lit phone); the money built from life-size bundles; the house
warmed (oak floors, travertine, sconces, plants, labelled bathrooms and housekeeper), the terrace hill re-shaped, the
gate's trees; the WHEN label in step with the captions; panels resized to clear the captions, auto-fitting text, hard
switches instead of crossfades; bigger study tags on solid cards; a red STILL TO GIVE line under the readout that climbs
with your money (the escalation); the pledge panel moved aside so the readout stays; the news on the TV on day three;
a push-in and jolts on the messages; a flash and snap on the last ball; the boardroom actually laughs; the TV switches
from a tax debate to an opinion show; a slower time-lapse; the old box's flaps hinged; the flat's door painted.

Still weak (honest): the studies section is still a run of lab tables; people are the stylised faceless rig; the
pledge is still a panel over a night window.

**Second independent review** (of the fixed 7:46 cut, 2026-10-26), scores as given: hook 6, retention through the
middle 5, clarity without narration 7, emotional payoff 5, image quality 6, composition 6, lighting/grade 6, polish 5,
science honesty 8, overall 6. It checked eight studies online and found them right except: the pledge's 22 are not
"all 256 signers"; the letters had money inside and poorer homes returned almost as many just after payday; "lived
almost exactly this story" overstated MacKenzie Scott; "over 1,600" is a 2022 count; "+2.4% risk" read as jargon.
Weakest stretches it named: 226–285 s (three lab studies in a row, the story stopped), 360–436 s (76 s without "you"),
the breakfast and empty room (162–188 s), the city texture behind the charts, and a few broken frames.

Fixed after it (not re-scored): the sweets study cut and replaced by a story beat (a business magazine puts you on its
cover: "You won a lottery. But you start to believe you earned it."); the pledge caption and panel ("the 22 pledgers who
have died"); the letters now say "with money inside" and add "But just after payday, poor homes sent back almost as
many." (with its own panel line); "And one real woman's story began a lot like yours."; OVER 1,600 BY 2022; 2.4% MORE
BANKRUPTCIES AMONG THE CLOSEST NEIGHBOURS; the years chart ends at the readout's own numbers (it said $7.4M given while
the readout said 2.2%); the WHERE clock follows the date (no more 1:13 AM breakfast); the REAL STUDY tag waits for the
study's caption; scene pins step aside under an open diagram; YOU / EVERYONE spaced; the Brickman title fits; the
MacKenzie Scott pin no longer covers WHERE and her envelopes read as paper before they light; the board of study cards
reframed clear of the readout; the door number moved out of the readout's corner; a darker backing for the message
counts over the phone and for captions on bright days; the garage shot starts beside the car, not above its roof; the
lamp and garage flares tamed; the city's windows bigger and fewer (no shimmer); a push-in under the title; a brighter
night shot; the same woman (camel coat, wine scarf) at all three crossings; the GIVE HALF AWAY note stuck beside the
phone on your dashboard at the end. The film is now 7:52.

Not changed: its biggest suggestion, cutting about 70 s of studies for new story beats. The owner asked for the research
on sudden power and greed, and the owner's length rule is about 8 minutes, so the cookie and Monopoly studies stay (each
with an honest label); the sweets study went because it was the weakest.

Still weak (honest): the fixes have not been re-reviewed. The middle (the lab studies, then the pledge, letters and two
real people) is still the likeliest drop-off, and it is still long without "you". People are the faceless stylised rig.
The Dunn lobby is very bright. The ending is quiet: you stop, she thanks you, the readout goes; nothing in the money
changes.
