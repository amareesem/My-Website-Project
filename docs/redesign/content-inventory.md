# PEAK content inventory

Crawled the live site on 19 November 2026. The public homepage is still one long page (about 1.9 MB) at `https://www.peakcognitivelongevity.com/`. Sections open from the menu and from hash links. Separate URLs that respond today are `/faq/`, `/evidence/`, and `/blog/{slug}/`. `/blog/` itself returns 404. `/about/`, `/program/`, `/pricing/`, `/contact/`, `/ebook/`, `/consultation/`, `/patient-stories/`, and `/resources/` also return 404 on the live domain. Those addresses exist on the preview, not on production.

Nothing below is new copy. Prices, quotes, and numbers are copied from the live page. Proposed removals are listed so Lori can approve them before they disappear.

## 8-page map

| New page | URL | What moves here |
| --- | --- | --- |
| Home | `/` | Short versions of who we help, why it matters, the four pillars, how it works, a one-line physician intro, three testimonials, three newest articles, one closing invitation |
| Meet the Physicians | `/physicians/` | The full origin story, physician bios, team, parent photos, and the 20-minute video. Today this is the About section (`#about`) |
| The Program | `/program/` | What the six months include, testing, basecamps, and the PEAK approach. Today this is `#program` |
| Who We Help | `/who-we-help/` | Who the program is for, plus the questions now on the home FAQ block and on `/faq/` |
| The Evidence | `/evidence/` | The research essay already at `/evidence/` and in `#evidence` |
| Resources | `/resources/` | Ordering help now at `#helpful-links`, plus links to the e-book and the blog. Vendor names stay off the marketing page |
| Investment | `/investment/` | Prices, cash or check prices, Cherry, HSA and FSA, and the couple discount. Today this is `#payment-options` |
| Contact | `/contact/` | The form, phone, email, address, and hours. Today this is `#contact` |

These stay available, but they are not in the new menu:

| Page | URL | Why it stays for now |
| --- | --- | --- |
| Blog index and posts | `/blog/` and `/blog/{slug}/` | Posts are the published articles. The build script must keep working. Scheduled posts still publish from master |
| E-book | `/ebook/` | The signup form is the way people get Food Fight. Lori asked that it leave the menu, not that access be removed |
| Consultation details | `/consultation/` | Holds the before, during, and after of the hour, the $350 credit, and the 48-hour refund. Proposed later move: a section on Investment. Not removed in this stage |
| Patient stories | `/patient-stories/` | Full reviews. The homepage keeps three short quotes only |

## Redirects this stage will turn on

| Old address | New address | Reason |
| --- | --- | --- |
| `/about/` and `#about` | `/physicians/` | Same story, new name |
| `/pricing/`, `/payment-options`, `#payment-options` | `/investment/` | Same prices, new name |
| `/faq/` and `#faq` | `/who-we-help/` | Questions stay. The page also says who the program is for |
| `/helpful-links` and `#helpful-links` | `/resources/` | Already the resources page on the preview |
| `#consultation` | `/consultation/` | Details stay on that page until Lori approves a move |
| `#ebook` and `#ebook-signup` | `/ebook/` | Signup stays |
| `#blog` | `/blog/` | Real blog index, which production is missing |
| `#patient-stories` and story hashes | `/patient-stories/` | Full stories stay |
| `#about-story-video` | `/physicians/#about-story-video` | Same video |

`/ebook/`, `/blog/`, `/consultation/`, and `/patient-stories/` are not redirected away. A redirect would hide content that does not yet have a full home on the 8-page map.

## Home (`#home`)

| Content | Where it goes | Note |
| --- | --- | --- |
| E-book banner, "Meet Food Fight" | `/ebook/` | Not repeated in the new menu |
| Headline "Dementia is not your destiny." | Proposed removal from the homepage | Fear opening. Lori's brief gives a new headline. The line is not reused |
| "Your sharpest years are still ahead." | Can stay as a supporting line. The new homepage headline is the one Lori suggested | Not a new claim |
| "see the hidden factors... years before any symptom" | Homepage section 3, softened | The em dash and the urgency are the problem, not the 20-year fact |
| Six-month physician-led program, Southlake and video | Hero explanation | Kept |
| Book your consultation, Watch our story | One homepage button only, plus a last section. The video moves to Meet the Physicians | The homepage will not stack both buttons in every section |
| "Two physicians, 62 years, 1:1 monthly, Southlake and virtual" | Physicians page and a short homepage intro | Kept |
| "The story you were told about dementia is out of date." | Homepage section 3, in plainer words | Kept as an idea, not as a scare line |
| Up to 20 years, 80%+, about 1 hour a week | Homepage section 3 | Numbers need a physician check. See claims list |
| "Your crystal ball" and the testing list | The Program | Includes the old IntellxxDNA name on the live site. The preview already says "an advanced genetic brain panel (500+ variants)" |
| "Your brain and body were designed to heal." | The Program or Physicians | Belief statement. Not a promise of reversal |
| Parent photos and Lori's quote | Meet the Physicians. One line and the photos stay on the homepage | Full story is not repeated on the homepage |
| "We built PEAK so it doesn't have to take you." | Proposed removal | Fear line. Not reused |
| Trailhead through Summit, four pillars | Homepage section 4 and 5, and The Program | Pillar names stay: Performance, Energy, Activity, Kindness |
| Three short reviews (L. Craig, Anonymous, Yvonne B.) | Homepage section 7 | Full text stays on Patient Stories |
| Ornish, Bredesen, Perlmutter, Lancet 2024 | The Evidence, with the official 80% / 45% sentence on the homepage | Names stay as citations, not as new claims |
| "PEAK has run a waiting list for much of 2026." | Proposed hold | See open questions. It is not on the new homepage until Lori confirms it is still true |
| "Healthspan, not just lifespan" and the "no pill" passage | The Program, if kept | The pill comparison is easy to misread as a promise. Flagged |
| Closing $350 consultation | Homepage final section and `/consultation/` | Price unchanged |

## Meet the Physicians (`#about`)

Full origin story, the quote, Dr. Lori King, MD and Dr. Chris King, MD bios, Barbara M. review, "Living what we teach" photos (ocean, mountain hike, waterfall, family hike), beliefs, Amareese Martinez (PEAK Assistant), Joe Derr (Patient Concierge), and the video `assets/KINGVIDEO-web.mp4` (about 20 minutes, shown twice on the live page). A second block repeats the bios and says Timarron Family Medicine, Southlake. That repeat should be one block on `/physicians/`, not two.

The live page also says "We believe cognitive decline is far more preventable than most people are told." That sentence stays available on the physicians page if it is already in the preview source. It is not added to the homepage.

## The Program (`#program`)

Six-month shape, weeks 1 to 2 testing, review of findings, six basecamps, monthly visits, weekly modules, the four pillars, and what is included by package in brief. Moves as-is to `/program/`. The homepage keeps only the five-step outline.

## The Evidence

Live `/evidence/` is a long essay: what is established, what is still emerging, the Lancet timeline, Ornish, FINGER, U.S. POINTER, and study citations. It stays at `/evidence/`. The homepage uses only the official sentence:

"Of the known risk factors for dementia, more than 80% are modifiable, and the Lancet Commission estimates that addressing just 14 of them could prevent or delay up to 45% of dementia cases worldwide."

## Blog

Live menu item Blog opens `#blog`, not `/blog/`.

Categories in the page: Sugar and Sweeteners, Whole Plant Foods, Plant Protein and Whole Grains, Quality Proteins and Healthy Fats, Eliminating Processed Foods, Gut Health, Mindset and Eating Habits, Longevity Pearls.

The real articles live at `/blog/{slug}/` (Food Fight, Longevity Pearls, and Brain Health). The newest Brain Health posts on the live site are:

- 12 November 2026, new dementia risk factors (LDL and vision)
- 14 November 2026, U.S. POINTER
- 17 November 2026, hearing and the ACHIEVE trial
- 19 November 2026, walking and steps

The homepage will show the three newest: walking, hearing, and U.S. POINTER.

### "No matching articles found"

Two separate problems:

1. `https://www.peakcognitivelongevity.com/blog/` returns 404. Post pages work. There is no public blog index on production, so "Blog" cannot open the real list.
2. On the homepage Blog section, the search box runs `foodFightSearch`, which filters other article grids. It does not run `blogSearch`, which is the function that fills this section and shows "No matching articles found." The empty line is in the HTML with the `hidden` attribute. It appears only if `blogRenderPosts` is called with an empty list. The search field never calls that function, so a search does not search this list. Category cards with no matching in-page article are hidden by script. The in-page list is a short embedded set. It is not the published `/blog/{slug}/` articles.

The preview already has a real `/blog/` index. This stage keeps it.

## Resources (`#helpful-links`)

Live copy names Fullscript and Ortho Molecular and says the practice may receive a margin on orders. The preview resources page already dropped those product names and describes a practice dispensary and pharmacy partners. That preview wording stays. Do not put the vendor names back.

## Investment (`#payment-options`)

| Item | Live figure |
| --- | --- |
| Silver, Gold, Executive | $7,529, $8,673, $10,024 |
| Cash or check | $7,239, $8,339, $9,638 |
| Brain biomarkers, metabolic panel, NAD+, neurotransmitters and hormones | All packages |
| Toxin panel and cognitive testing | Gold and Executive |
| Advanced genetic brain panel (live name: IntellxxDNA Brain Optimization Panel, 500+ variants) | Executive only |
| Consultation credit | $350, credited if you enroll |
| Cherry | 0% for 6 to 12 months for qualifying applicants. Link `https://pay.withcherry.com/peakcognitivelongevity`. A QR code is on the page |
| HSA and FSA | Documentation offered. Coverage is not guaranteed |
| Couples | Second consultation free the same day. $500 off each if both enroll |

Yvonne B.'s short review is repeated on this section. Homepage keeps her in the testimonial group once.

## Consultation (`#consultation`)

One hour with Dr. Lori or Dr. Chris. About 30 minutes of history before. $350, credited if you enroll, refundable up to 48 hours before. A guest may attend. A spouse's own visit is free when booked back to back. Booking link: Practice Better `https://timarronaestheticcenter.practicebetter.io/#/666c7768ad746af80f84ddc6/bookings?r=67868e4b5507f788d6a47270`. Client portal is the same host with `#/signin`.

## Contact (`#contact`)

Form fields: name, phone, email, message, honeypot `website`, reCAPTCHA. Warning: do not include medical records or sensitive health information. Emergencies: call 911. Phone (817) 796-5115. Email team@peakcognitivelongevity.com. 200 Pecan Creek Drive, Southlake, TX 76092. Hours: Mon to Thu 8:00 AM to 4:30 PM, Fri 8:00 AM to 12:00 PM.

## E-book (`#ebook`)

Food Fight, Dr. Lori King, MD. 166 pages, 26 short chapters, recipes. Signup iframe `https://link.peakcognitivelongevity.com/widget/form/JvGwX8MG7DenmjwVKses`. The live page says Timarron Wellness. The preview says Timarron Family Medicine. Open question which name Lori wants on the e-book page.

## Patient stories (`#patient-stories`)

Disclaimer: individual results vary. PEAK does not diagnose, treat, or cure dementia or Alzheimer's disease. Stories use first name and last initial, or Anonymous. Known names on the live page: L. Craig, Anonymous, Yvonne B., Barbara M.

## Repeated blocks

| Block | Where it is repeated |
| --- | --- |
| Origin story and parent photos | Home, About (twice on the live About view), video caption |
| "I lost 2 people I loved deeply..." | Home, About, physician cards |
| Six-month program description | Home, Program, Investment, FAQ |
| Book a consultation | Home (many times), About, Program, Investment, Consultation, FAQ, Patient stories |
| $350 credit, spouse consult free, $500 off | Home FAQ, Investment, Consultation, `/faq/` |
| Four pillars | Home and Program |
| Testing list | Home and Program |
| Yvonne B. quote | Home and Investment |
| Physician bios | About, shown in two stacks |
| Official 80% / 45% sentence | Home, Evidence, several articles |

New homepage rule: the consultation button appears in the hero and once at the end. The origin story is one line, with the full story only on Meet the Physicians.

## Numbers and claims that need a physician check

- More than 80% of known dementia risk factors are modifiable. Up to 45% of cases could be prevented or delayed by addressing 14 factors (Lancet Commission). This sentence is the approved wording and must stay exact where it is used.
- Brain changes can begin as many as 20 years before symptoms.
- About one hour a week, plus one monthly physician visit.
- 62 years of family medicine between the two physicians.
- Dr. Lori carries very high genetic risk and "has lowered her biological age by more than 10 years" (FAQ).
- Package prices and cash or check prices above.
- $350 consultation, 48-hour refund, spouse consult free, $500 off each.
- Four brain biomarkers: p-Tau 217, amyloid beta 42/40, NfL, GFAP.
- Advanced genetic panel looks at more than 500 variants (Executive).
- Cherry: 0% APR, 6 to 12 months, qualifying applicants, and the claim that checking options does not affect the credit score.
- E-book: 166 pages, 26 chapters. "Leafy-greens habit linked to brains that performed about 11 years younger."
- Blog: ACHIEVE "about 48% slower decline" in a higher-risk group. Walking study "5,000 to 7,500 steps." U.S. POINTER: 2,111 adults. These stay inside the articles, not as new homepage claims.
- "Far more preventable than most people are told" on the live physicians block.

## Broken links and broken behavior

- `/blog/` is 404 on the live site.
- `/about/`, `/program/`, `/pricing/`, `/contact/`, `/ebook/`, `/consultation/`, `/patient-stories/`, and `/resources/` are 404 on the live site. The menu uses hashes on the homepage instead.
- Blog search calls the wrong function (`foodFightSearch` instead of `blogSearch`), so the Blog search box does not search the Blog list.
- "No matching articles found." is the empty state for that in-page list. It is not wired to the search box. See the blog section above.
- The homepage file is about 1.9 MB because many photos are embedded in the page.

## Open questions for Lori

1. Is the waiting list line still true? The live homepage says PEAK has run a waiting list for much of 2026. It is not on the new homepage until you confirm.
2. Is Cherry still the financing offer? The live Investment section still links to `https://pay.withcherry.com/peakcognitivelongevity` and shows a QR code. The preview keeps that block on Investment. Say if it should come off.
3. Which testimonials have permission to stay? The site uses L. Craig, Anonymous, Yvonne B., and Barbara M. No new quotes were added.
4. E-book footer: Timarron Wellness (live) or Timarron Family Medicine (preview)?
5. Should the full consultation page move onto Investment, or stay at `/consultation/` out of the menu?
6. Should patient stories stay on their own page, or fold into Who We Help later?
7. The live helpful-links section names Fullscript and Ortho Molecular. The preview already removed those names. Confirm that stays.

## What this stage does not remove

Vendor names stay off the preview. The IntellxxDNA name stays replaced with "an advanced genetic brain panel (500+ variants)" on the homepage, the Investment table, and the Evidence page. Prices, the $350 consultation, the couple offer, the form warning, and the existing testimonials are unchanged.
