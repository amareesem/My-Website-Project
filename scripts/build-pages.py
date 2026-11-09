#!/usr/bin/env python3
"""Write the multi-page PEAK site from shared chrome and existing facts."""

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://www.peakcognitivelongevity.com"
BOOK = "https://timarronaestheticcenter.practicebetter.io/#/666c7768ad746af80f84ddc6/bookings?r=67868e4b5507f788d6a47270"
OG_DEFAULT = f"{ORIGIN}/assets/photos/Person-Hiking-Alpine-Valley.jpg"

NAV = [
    ("/about/", "Our Story", "about"),
    ("/program/", "Program", "program"),
    ("/pricing/", "Pricing", "pricing"),
    ("/faq/", "FAQ", "faq"),
    ("/blog/", "Blog", "blog"),
    ("/ebook/", "E-book", "ebook"),
    ("/contact/", "Contact", "contact"),
]


def e(value):
    return html.escape(value, quote=True)


def clinic_schema():
    return {
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "name": "PEAK Cognitive Longevity",
        "url": ORIGIN + "/",
        "telephone": "+1-817-796-5115",
        "email": "team@peakcognitivelongevity.com",
        "priceRange": "$7,529 to $10,024",
        "medicalSpecialty": "Family Medicine",
        "parentOrganization": {"@type": "MedicalOrganization", "name": "Timarron Family Medicine"},
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "200 Pecan Creek Drive",
            "addressLocality": "Southlake",
            "addressRegion": "TX",
            "postalCode": "76092",
            "addressCountry": "US",
        },
        "areaServed": [
            {"@type": "City", "name": "Southlake"},
            {"@type": "Country", "name": "United States"},
        ],
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
                "opens": "08:00",
                "closes": "16:30",
            },
            {"@type": "OpeningHoursSpecification", "dayOfWeek": "Friday", "opens": "08:00", "closes": "12:00"},
        ],
    }


def physician(name, job, image, description):
    return {
        "@context": "https://schema.org",
        "@type": "Physician",
        "name": name,
        "jobTitle": job,
        "description": description,
        "medicalSpecialty": "Family Medicine",
        "image": image,
        "telephone": "+1-817-796-5115",
        "address": clinic_schema()["address"],
        "worksFor": {"@type": "MedicalClinic", "name": "PEAK Cognitive Longevity", "url": ORIGIN + "/"},
        "affiliation": {"@type": "MedicalOrganization", "name": "Timarron Family Medicine"},
    }


LORI = physician(
    "Dr. Lori King, MD",
    "Founder and Physician",
    f"{ORIGIN}/assets/photos/dr-lori-king.jpg",
    "A conventionally trained family physician who retrained in root-cause and longevity medicine after losing a parent to dementia.",
)
CHRIS = physician(
    "Dr. Chris King, MD",
    "Co-Founder and Physician",
    f"{ORIGIN}/assets/photos/dr-chris-king.jpg",
    "A conventionally trained family physician who retrained in root-cause and longevity medicine and co-developed PEAK.",
)


def head(title, description, path, image, schemas):
    canonical = ORIGIN + path
    blocks = "\n".join(
        f'<script type="application/ld+json">{json.dumps(item, ensure_ascii=False)}</script>' for item in schemas
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)}</title>
  <meta name="description" content="{e(description)}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="{e(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PEAK Cognitive Longevity">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(description)}">
  <meta property="og:url" content="{e(canonical)}">
  <meta property="og:image" content="{e(image)}">
  <meta property="og:locale" content="en_US">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&amp;family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/site.css">
  {blocks}
  <script src="/assets/analytics.js" defer></script>
</head>
"""


def header(active):
    links = []
    for href, label, key in NAV:
        current = ' aria-current="page"' if key == active else ""
        links.append(f'<a href="{href}"{current}>{label}</a>')
    return f"""<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site">
  <div class="utility">
    <div class="wrap utility-inner">
      <a href="tel:+18177965115">(817) 796-5115</a>
      <a href="mailto:team@peakcognitivelongevity.com">team@peakcognitivelongevity.com</a>
      <span class="spacer"></span>
      <a href="/contact/">Contact</a>
    </div>
  </div>
  <div class="wrap bar">
    <a class="brand" href="/">
      <img src="/assets/photos/peak-logo-cropped.png" alt="PEAK Cognitive Longevity logo" width="56" height="58">
      <span>PEAK Cognitive Longevity</span>
    </a>
    <a class="btn bar-book" href="/consultation/">Book</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
      <span class="nav-toggle-bars" aria-hidden="true"></span>
      Menu
    </button>
    <nav class="primary" id="primary-nav" aria-label="Main">
      {''.join(links)}
      <a class="btn nav-book" href="/consultation/">Book a consultation</a>
    </nav>
  </div>
</header>
"""


def footer():
    return """<footer class="site">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <img src="/assets/photos/pcl-logo-gray-text-white-mts.png" alt="PEAK Cognitive Longevity logo" width="64" height="64">
      <p>PEAK Cognitive Longevity is a physician-led program at Timarron Family Medicine. Southlake, Texas, and virtual nationwide.</p>
    </div>
    <div>
      <h2>Explore</h2>
      <ul class="foot-links">
        <li><a href="/about/">Our Story</a></li>
        <li><a href="/program/">The Program</a></li>
        <li><a href="/pricing/">Pricing</a></li>
        <li><a href="/evidence/">The Evidence</a></li>
        <li><a href="/patient-stories/">Patient Stories</a></li>
      </ul>
    </div>
    <div>
      <h2>Start here</h2>
      <ul class="foot-links">
        <li><a href="/consultation/">Book Your Consultation</a></li>
        <li><a href="/ebook/">Free E-book</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="/faq/">FAQ</a></li>
        <li><a href="/contact/">Contact</a></li>
        <li><a href="/resources/">Ordering and Resources</a></li>
      </ul>
    </div>
    <div>
      <h2>Visit</h2>
      <p><a href="tel:+18177965115">(817) 796-5115</a><br>
      <a href="mailto:team@peakcognitivelongevity.com">team@peakcognitivelongevity.com</a></p>
      <p>200 Pecan Creek Drive<br>Southlake, TX 76092</p>
      <p>Mon to Thu, 8:00 AM to 4:30 PM<br>Fri, 8:00 AM to 12:00 PM</p>
    </div>
  </div>
  <div class="wrap legal">
    <p>&copy; 2026 PEAK Cognitive Longevity. All rights reserved.</p>
    <p>PEAK Cognitive Longevity does not diagnose, treat, or cure dementia or Alzheimer's disease. Individual results vary.</p>
  </div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
"""


def page(path, title, description, active, body, schemas=None, image=OG_DEFAULT):
    schemas = schemas or [clinic_schema()]
    document = head(title, description, path, image, schemas) + header(active) + body + footer()
    banned = ["\u2014", "\u2013", "&mdash;", "&ndash;", "Fullscript", "Ortho Molecular", "Orthomolecular", "Dementia is not your destiny", "Dementia Is Not Your Destiny"]
    for token in banned:
        if token in document:
            raise SystemExit(f"{path} contains forbidden token: {token}")
    document = document.replace("<img ", '<img loading="lazy" ')
    document = document.replace('<img loading="lazy" src="/assets/photos/peak-logo-cropped.png"', '<img src="/assets/photos/peak-logo-cropped.png"')
    document = document.replace('loading="lazy" fetchpriority="high"', 'fetchpriority="high"')
    if document.lower().count("<h1") != 1:
        raise SystemExit(f"{path} must have exactly one h1")
    if len(description) > 155:
        raise SystemExit(f"{path} description is {len(description)} characters")
    target = ROOT / "index.html" if path == "/" else ROOT / path.strip("/") / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(document, encoding="utf-8")
    print(path, target.stat().st_size)


def cta(extra=""):
    return f"""<div class="actions">
      <a class="btn" href="/consultation/">Book Your Consultation</a>
      {extra}
    </div>"""


HOME = """
<main id="main">
  <section class="hero">
    <div class="wrap hero-grid">
      <figure class="hero-photo">
        <img src="/assets/photos/Person-Hiking-Alpine-Valley.jpg" alt="A hiker on a mountain trail overlooking an alpine valley" width="1600" height="1066" fetchpriority="high">
      </figure>
      <div>
        <p class="eyebrow">Physician-led cognitive longevity</p>
        <h1>Your sharpest years are still ahead.</h1>
        <p class="lede">A six-month program with your own physician, in Southlake and by video nationwide.</p>
        <a class="btn" href="/consultation/">Book a consultation</a>
      </div>
    </div>
  </section>
  <section class="who-band">
    <div class="wrap">
      <p class="who"><strong>Who PEAK is for</strong> Adults who want to stay sharp, often before memory problems show. Many patients come after watching a parent live with dementia. You do not need a diagnosis to start. Visits happen in Southlake and by video across the country. Call us to confirm availability in your state.</p>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap">
      <div class="narrow">
        <h2>The story most of us were told is incomplete.</h2>
        <p>You have probably heard what we were taught in medical school: dementia is genetic, it is bad luck, and nothing can be done until memory starts slipping. The science now tells a different story. <strong>90% of the risk factors for cognitive decline are modifiable through physician directed lifestyle protocols</strong>.</p>
        <p>The brain changes behind Alzheimer's can begin as many as 20 years before the first forgotten name. That means your 40s, 50s, and 60s are not a waiting room. They are your window.</p>
      </div>
      <div class="stat-row">
        <div class="stat"><strong>Up to 20 years</strong><span>how early brain changes can begin before symptoms</span></div>
        <div class="stat"><strong>90%</strong><span>of risk factors for cognitive decline are modifiable</span></div>
        <div class="stat"><strong>About 1 hour a week</strong><span>your time commitment in PEAK</span></div>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="narrow">
        <p class="eyebrow">What we measure</p>
        <h2>See the factors that can shape your brain, while you can still work on them.</h2>
        <p>These are not guesses based only on family history. They come from your own blood, genes, and biology. Most people never see these numbers. You can see them while there is still time to work with them.</p>
      </div>
      <ul class="fact-list">
        <li><h3>Early-warning brain signals</h3><p>p-Tau 217, amyloid beta 42/40, NfL, and GFAP</p></li>
        <li><h3>Your genetic blueprint</h3><p>APOE4 and critical risk genes, plus the IntellxxDNA Brain Optimization Panel (500+ variants)</p></li>
        <li><h3>Hidden inflammation and blood sugar</h3><p>Comprehensive metabolic blood panel</p></li>
        <li><h3>Your cellular energy</h3><p>NAD+ testing</p></li>
        <li><h3>Toxins that can stress the brain</h3><p>Total Toxin Burden Analysis</p></li>
        <li><h3>Brain chemistry and hormones</h3><p>Neurotransmitter and hormone evaluation</p></li>
        <li><h3>How your brain performs today</h3><p>Professional cognitive performance testing</p></li>
      </ul>
      <p class="note">Testing included varies by package.</p>
      <p>Every finding comes with a plan. The point is to know what to do next.</p>
      <div class="actions"><a class="btn" href="/program/">See the program</a><a class="btn btn-line" href="/pricing/">See pricing</a></div>
    </div>
  </section>
  <section class="section section-navy">
    <div class="wrap narrow">
      <h2>Your brain and body were designed to heal.</h2>
      <p>We believe that, given the right conditions, the body does what it was made to do: repair, renew, and thrive. Cognitive decline is not a random sentence. It often follows root causes such as inflammation, blood sugar, gut health, toxins, sleep, hormones, and cellular energy. Find them and address them, and you give your brain better conditions for the decades ahead.</p>
      <p>The mind is a gift worth fighting for.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap split">
      <div>
        <div class="pair-photos">
          <figure>
            <img src="/assets/photos/Lori-with-Dad.jpg" alt="Dr. Lori King with her father" width="800" height="1000">
            <figcaption>Dr. Lori with her father</figcaption>
          </figure>
          <figure>
            <img src="/assets/photos/Chris-with-Mom.jpg" alt="Dr. Chris King with his mother" width="800" height="1000">
            <figcaption>Dr. Chris with his mother</figcaption>
          </figure>
        </div>
      </div>
      <div>
        <h2>We each lost a parent to dementia. We built PEAK so other families can start sooner.</h2>
        <p>After 62 years in family medicine, we each lost a parent to dementia. We retrained in root-cause and longevity medicine to offer families the answers and support we wish our parents had.</p>
        <p><a href="/about/">Read our full story</a></p>
        <div class="actions">
          <a class="btn" href="/consultation/">Book Your Consultation</a>
          <a class="btn btn-line" href="/about/#about-story-video">Watch our story (20 min)</a>
        </div>
      </div>
    </div>
    <div class="wrap quotes" style="margin-top:36px;">
      <figure>
        <img src="/assets/photos/dr-lori-king.jpg" alt="Dr. Lori King, MD" width="280" height="350">
        <blockquote>"I lost 2 people I loved deeply to dementia, and I promised myself I would spend my career making sure that didn't happen to anyone else I could reach."</blockquote>
        <figcaption>Dr. Lori King, MD <span>Founder and Physician</span></figcaption>
      </figure>
      <figure>
        <img src="/assets/photos/dr-chris-king.jpg" alt="Dr. Chris King, MD" width="280" height="350">
        <blockquote>"PEAK is everything we wish our parents had."</blockquote>
        <figcaption>Drs. Lori and Chris King <span>Founders</span></figcaption>
      </figure>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap">
      <p class="eyebrow">The PEAK program</p>
      <h2>Your climb to the PEAK: six months, your own physician, one step at a time.</h2>
      <ol class="steps">
        <li><span class="k">Trailhead</span><h3>Your consultation</h3><p>One hour, 1:1 with Dr. Lori or Dr. Chris. The real work starts here.</p></li>
        <li><span class="k">Weeks 1 to 2</span><h3>At-home testing</h3><p>A look at the hidden factors shaping your brain's future.</p></li>
        <li><span class="k">Weeks 3 to 4</span><h3>Review of Findings</h3><p>We walk you through every result and build a protocol designed for you alone.</p></li>
        <li><span class="k">Months 2 to 7</span><h3>Six Basecamps</h3><p>Foundations and Observation, then Inflammation, Mitochondrial Health, Cellular Energy and Performance, Autophagy and Cellular Regeneration, and Lifelong Brain Health.</p></li>
        <li><span class="k">Summit</span><h3>Graduation</h3><p>You leave a PEAK graduate, with the option to keep climbing in PEAK Ascent.</p></li>
      </ol>
      <p><strong>Two journeys at once:</strong> a monthly 1:1 virtual visit with your physician, and a short weekly module with clear action steps, plus anytime secure messaging with your doctor.</p>
      <p>No guilt. No willpower marathons. Small, joyful changes you will actually love, because lifestyle change is life.</p>
      <div class="cards cards-4">
        <article class="card">
          <img src="/assets/photos/living-what-we-teach/drs-king-mountain-hike.jpg" alt="Drs. Lori and Chris King hiking in the mountains" width="1200" height="900">
          <h3>Performance</h3>
          <p>Mind-body connection: meditation, sauna, gratitude, relationships, breathwork, nature.</p>
        </article>
        <article class="card">
          <img src="/assets/photos/food-fight-ebook-cover.jpg" alt="Food Fight e-book cover by Dr. Lori King, MD" width="600" height="800">
          <h3>Energy</h3>
          <p>A nutrient-dense, personalized way of eating that fuels your brain.</p>
        </article>
        <article class="card">
          <img src="/assets/photos/Mountain-Trail-Sunrise.jpg" alt="A quiet mountain trail at sunrise" width="1600" height="1067">
          <h3>Activity</h3>
          <p>Movement that boosts blood flow and calms inflammation.</p>
        </article>
        <article class="card">
          <img src="/assets/photos/living-what-we-teach/king-family-hike.jpg" alt="The King family hiking together" width="1200" height="900">
          <h3>Kindness</h3>
          <p>Self-care: restorative sleep, toxin avoidance, and detoxification.</p>
        </article>
      </div>
      <div class="actions"><a class="btn" href="/program/">See the program</a><a class="btn btn-line" href="/ebook/">Get the Free E-book</a></div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <p class="eyebrow">From our patients</p>
      <h2>In their words</h2>
      <div class="reviews">
        <figure class="review">
          <blockquote>Dr. Lori is willing to sit down and spend enough quality time actually listening and caring about me to do whatever it takes and find the ROOT causes! ... I finally have hope. I watched both parents die an inch at a time and I no longer feel swept up into my inevitable. Now I have a fighting chance to change everything.</blockquote>
          <figcaption><strong>L. Craig</strong> · PEAK patient</figcaption>
          <a href="/patient-stories/#l-craig">Read the full review</a>
        </figure>
        <figure class="review">
          <blockquote>Before starting the program, I felt sluggish, dealt with daily brain fog, and honestly didn't feel like myself. Since joining Peak Longevity, that has completely changed. I feel energized, clear-headed, and like me again. ... The monthly check-ins are a huge part of what makes the program so successful. They keep me accountable, supported, and moving forward.</blockquote>
          <figcaption><strong>Anonymous</strong> · PEAK patient</figcaption>
          <a href="/patient-stories/#anonymous">Read the full review</a>
        </figure>
        <figure class="review">
          <blockquote>I initially sat in on my husband's consultation with Dr. Lori King, never expecting that by the end of the appointment, I would sign up too. ... I encourage anyone who has ever been told by a doctor, as I was, that "that's your lot in life" to have a conversation with Dr. Lori King. There is hope, and there are answers.</blockquote>
          <figcaption><strong>Yvonne B.</strong> · PEAK patient</figcaption>
          <a href="/patient-stories/#yvonne">Read the full review</a>
        </figure>
      </div>
      <p class="note">Individual experiences vary.</p>
      <p><a href="/patient-stories/">Read all patient stories</a></p>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap">
      <h2>Built on research you can read for yourself.</h2>
      <ul class="research">
        <li><h3>Dr. Dean Ornish</h3><p>2024 trial of an intensive lifestyle program in early Alzheimer's disease</p></li>
        <li><h3>Dr. Dale Bredesen</h3><p>Pioneer of the root-cause approach to cognitive decline</p></li>
        <li><h3>Dr. David Perlmutter</h3><p>Research on inflammation, the gut, and the brain's immune cells</p></li>
        <li><h3>The Lancet Commission, 2024</h3><p>Identified 14 modifiable risk factors for dementia</p></li>
      </ul>
      <div class="actions"><a class="btn" href="/evidence/">See the evidence</a><a class="btn btn-line" href="/blog/">Read the blog</a></div>
      <p>PEAK has run a waiting list for much of 2026. We keep it small so every patient gets real physician time.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap narrow">
      <p class="eyebrow">Healthspan, not just lifespan</p>
      <h2>This is about your next 30 years.</h2>
      <p>Cognitive longevity means being the one who remembers the grandkids' recital, plans the trip, runs the business, finishes the crossword, and is still the person everyone calls for advice. The root causes we address for your brain also show up in energy, sleep, weight, mood, and blood pressure.</p>
      <p>There is no single pill for that future. The small choices you make every day matter: how and when you eat, how you move and sleep, the light you see, the toxins around you, how you handle stress, and the gratitude, nature, and connection in your life. Each choice either fuels your brain or quietly drains it.</p>
      <p>PEAK puts a plan built for your body in your hands, along with the knowledge to choose with confidence. One choice at a time, the future you just pictured becomes something you build.</p>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap narrow">
      <h2>A few questions people ask first</h2>
      <details class="faq"><summary>Do I need to have memory problems to start?</summary><p>No. The best time is before anything shows. Most PEAK patients come because they want to keep it that way, often after watching a parent decline.</p></details>
      <details class="faq"><summary>What if a result is hard to hear?</summary><p>Every result arrives with a plan and a physician beside you. We look for risks so we can work on them, not to deliver a verdict.</p></details>
      <details class="faq"><summary>Can my spouse join me?</summary><p>Yes. Your spouse's consultation is free when booked with yours, and if you both enroll, you each receive $500 off.</p></details>
      <p><a href="/faq/">Read all of the questions</a></p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <h2>From the physicians' writing</h2>
      <div class="cards cards-3">
        <article class="card">
          <a href="/blog/food-fight-weight-loss-chronic-disease-brain-health/"><img src="/assets/photos/food-fight-ebook-cover.jpg" alt="Food Fight e-book cover by Dr. Lori King, MD" width="600" height="800"></a>
          <h3><a href="/blog/food-fight-weight-loss-chronic-disease-brain-health/">The Food Fight: how diet affects weight, disease, and brain health</a></h3>
          <p>The opening chapter of Food Fight, from Dr. Lori King, MD.</p>
        </article>
        <article class="card">
          <a href="/blog/morning-sunlight-brain-health/"><img src="/assets/photos/Mountain%20Sunrise%20Sun%20Beams.jpg" alt="Sunlight breaking over a mountain ridge at sunrise" width="1400" height="900"></a>
          <h3><a href="/blog/morning-sunlight-brain-health/">Morning sunlight and brain health</a></h3>
          <p>A short Longevity Pearl on a daily habit you can start outside.</p>
        </article>
        <article class="card">
          <a href="/blog/morning-exercise-brain-health/"><img src="/assets/photos/Mountain-Trail-Sunrise.jpg" alt="A quiet mountain trail at sunrise" width="1600" height="1067"></a>
          <h3><a href="/blog/morning-exercise-brain-health/">A simple morning movement habit</a></h3>
          <p>Another Longevity Pearl from Dr. Lori, written for real mornings.</p>
        </article>
      </div>
      <div class="actions"><a class="btn" href="/blog/">Read the blog</a><a class="btn btn-line" href="/ebook/">Get the Free E-book</a></div>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap">
      <h2>Next steps</h2>
      <ol class="next-steps">
        <li><a href="/consultation/">Book a consultation</a><p>One hour with Dr. Lori or Dr. Chris. $350, credited toward the program if you enroll. A spouse's consultation is free when booked together.</p></li>
        <li><a href="/ebook/">Get the free e-book</a><p>Food Fight, practical food swaps from Dr. Lori King, MD.</p></li>
        <li><a href="/blog/">Read the blog</a><p>The Food Fight series and Longevity Pearls, one short chapter at a time.</p></li>
        <li><a href="/contact/">Contact the team</a><p>(817) 796-5115 or team@peakcognitivelongevity.com. Mon to Thu, 8:00 AM to 4:30 PM. Fri, 8:00 AM to 12:00 PM.</p></li>
      </ol>
    </div>
  </section>
</main>
"""

ABOUT = """
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">Our story</p>
      <h1>Two family doctors. One promise.</h1>
      <p class="lede">For decades we cared for families in Southlake. Then dementia came into our own family, and it changed the kind of doctors we are.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap prose narrow">
      <h2>Our story</h2>
      <p>Between us, we have practiced family medicine for 62 years. We each lost a parent to dementia, and we did everything conventional medicine taught us. It was not enough, because what we had been taught was incomplete.</p>
      <p>So we went back to learning. We retrained in root-cause and longevity medicine, applied it to ourselves first, and built PEAK so other families would have what ours never did: answers early enough to change the story.</p>
      <blockquote class="story-quote">
        <p>"I lost 2 people I loved deeply to dementia, and I promised myself I would spend my career making sure that didn't happen to anyone else I could reach."</p>
        <cite>Dr. Lori King, MD</cite>
      </blockquote>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap">
      <h2>The physicians behind PEAK</h2>
      <div class="physicians">
        <article>
          <img class="portrait" src="/assets/photos/dr-lori-king.jpg" alt="Dr. Lori King, MD" width="400" height="500">
          <h3>Dr. Lori King, MD</h3>
          <p class="role">Founder and Physician</p>
          <p>A conventionally trained family physician who retrained in root-cause and longevity medicine. Dr. Lori brings decades of family-medicine experience and a personal commitment to helping families act early to support brain health.</p>
        </article>
        <article>
          <img class="portrait" src="/assets/photos/dr-chris-king.jpg" alt="Dr. Chris King, MD" width="480" height="600">
          <h3>Dr. Chris King, MD</h3>
          <p class="role">Co-Founder and Physician</p>
          <p>A conventionally trained family physician who retrained in root-cause and longevity medicine. Dr. Chris co-developed PEAK and works one to one with patients, guiding them through each Basecamp with the care he brought to decades of family practice.</p>
        </article>
      </div>
      <div class="narrow" style="margin-top:28px;">
        <p>PEAK was built by Dr. Lori King and Dr. Chris King, the physicians of Timarron Family Medicine in Southlake, Texas. Between them they have more than sixty years in family practice, most of it spent doing conventional medicine well.</p>
        <p>Several years ago they both retrained in root-cause and longevity medicine, because the conventional model had no useful answer to the question that mattered most to their own families.</p>
        <p><strong>In PEAK, you work directly with one of them.</strong></p>
        <p>Not a coach, not a care coordinator, not a protocol delivered by an app. Your own physician, every month, for six months.</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap narrow">
      <h2>Our parents</h2>
      <div class="pair-photos">
        <figure>
          <img src="/assets/photos/Lori-with-Dad.jpg" alt="Dr. Lori King with her father" width="800" height="1000">
          <figcaption>Dr. Lori with her father</figcaption>
        </figure>
        <figure>
          <img src="/assets/photos/Chris-with-Mom.jpg" alt="Dr. Chris King with his mother" width="800" height="1000">
          <figcaption>Dr. Chris with his mother</figcaption>
        </figure>
      </div>
      <p>We know dementia as physicians, and as a daughter and son who watched a parent live with it. We did what we knew to do for our own families, but conventional medicine offered few ways to look for the underlying risks early or a clear path to change them.</p>
      <p>That experience changed the questions we asked in our practice. We retrained in root-cause and longevity medicine, and built PEAK to bring families earlier testing, a physician who knows them, and practical steps to support brain health.</p>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap narrow">
      <figure class="review">
        <blockquote>We are impressed with the knowledge and care provided by Dr. Lori. Embarking on this health journey to longevity will be easier with her guidance and counsel. Thank you for developing this program to help us navigate our "golden years" and make them more healthy!</blockquote>
        <figcaption><strong>Barbara M.</strong> · PEAK patient</figcaption>
        <a href="/patient-stories/#barbara">Read the full review</a>
      </figure>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <h2>Living what we teach</h2>
      <p class="narrow">We do not ask our patients to do anything we do not do ourselves. Hiking, cooking real food, protecting our sleep, and time with the people we love: this is what cognitive longevity looks like in real life.</p>
      <div class="living" role="group" aria-label="The King family enjoying an active life together">
        <figure><img src="/assets/photos/living-what-we-teach/drs-king-by-the-ocean.jpg" width="1200" height="900" alt="Drs. Lori and Chris King enjoying time together by the ocean"></figure>
        <figure><img src="/assets/photos/living-what-we-teach/drs-king-mountain-hike.jpg" width="1200" height="900" alt="Drs. Lori and Chris King hiking in the mountains"></figure>
        <figure><img src="/assets/photos/living-what-we-teach/drs-king-waterfall-hike.jpg" width="1200" height="900" alt="Drs. Lori and Chris King hiking near a waterfall"></figure>
        <figure><img src="/assets/photos/living-what-we-teach/king-family-hike.jpg" width="1200" height="900" alt="The King family hiking together"></figure>
      </div>
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap">
      <h2>What we believe</h2>
      <div class="beliefs">
        <article><h3>Your body was designed to heal.</h3><p>Given the right conditions, the brain and body repair, renew, and thrive.</p></article>
        <article><h3>Root causes, not symptoms.</h3><p>We look for the inflammation, blood sugar, toxins, gut, sleep, and hormone issues that can drive decline.</p></article>
        <article><h3>Joy first.</h3><p>Lifestyle change is life. Small, joyful steps beat willpower and guilt.</p></article>
        <article><h3>We walk beside you.</h3><p>Your own physician every month, and a team that knows you by name.</p></article>
      </div>
      <div class="narrow" style="margin-top:28px;">
        <p>PEAK Cognitive Longevity is a physician-led program. We measure what we can, look for root causes, and build a protocol for one person at a time. We do not promise to prevent or reverse dementia. You get physician time, clear testing, and a plan you can follow.</p>
        <p>The mind is a gift worth fighting for. This is the climb, and we walk it beside the people we serve.</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <h2>Your PEAK team</h2>
      <p>Physician-led, with support from a team that knows every patient by name.</p>
      <div class="team">
        <article>
          <img src="/assets/photos/amareese-martinez.png" width="400" height="400" alt="Amareese Martinez">
          <div><h3>Amareese Martinez</h3><p class="role">PEAK Assistant</p><p>Keeps your appointments, kits, and supplements running smoothly.</p></div>
        </article>
        <article>
          <img src="/assets/photos/joe-derr-profile.jpg" width="400" height="400" alt="Joe Derr">
          <div><h3>Joe Derr</h3><p class="role">Patient Concierge</p><p>Your guide from your first question through graduation.</p></div>
        </article>
      </div>
    </div>
  </section>
  <section class="section section-paper" id="about-story-video">
    <div class="wrap narrow">
      <h2>Watch our story (20 min)</h2>
      <p>The video we wish someone had shown us when our parents were first diagnosed.</p>
      <video class="video" controls preload="metadata" playsinline aria-label="Drs. Lori and Chris King introduce PEAK Cognitive Longevity">
        <source src="/assets/KINGVIDEO-web.mp4" type="video/mp4">
        Your browser does not support HTML video. Please use a modern browser to watch the PEAK introduction.
      </video>
      <p><a href="/assets/KINGVIDEO-web.mp4">If the video does not play, open it in a video player.</a></p>
    </div>
  </section>
  <section class="section section-navy">
    <div class="wrap narrow">
      <h2>The climb begins with a conversation.</h2>
      <div class="actions">
        <a class="btn" href="/consultation/">Book Your Consultation</a>
        <a class="btn btn-line-light" href="tel:+18177965115">Call (817) 796-5115</a>
      </div>
    </div>
  </section>
</main>
"""

PROGRAM = """
<main id="main">
  <section class="page-intro">
    <div class="wrap split">
      <div>
        <p class="eyebrow">The program</p>
        <h1>What PEAK actually includes</h1>
        <p class="lede">Six months. Two things happening at once: a personal clinical relationship, and a structured education that changes how you live.</p>
        <div class="actions"><a class="btn" href="/consultation/">Book Your Consultation</a><a class="btn btn-line" href="/pricing/">See pricing</a></div>
      </div>
      <img src="/assets/photos/Mountain-Trail-Sunrise.jpg" alt="A quiet mountain trail at sunrise" width="1200" height="800">
    </div>
  </section>
  <section class="section">
    <div class="wrap timeline">
      <div class="step"><span class="k">Weeks 1 to 2</span><h2>Testing</h2><p>Advanced testing done largely from home. We measure your brain with four blood biomarkers, then look at the systems feeding into it: metabolic and cardiovascular health, gut health, vitamins and nutrients, hormones and neurotransmitters, cellular energy, and, depending on your tier, genetics, environmental exposure, and professional cognitive testing.</p></div>
      <figure class="review">
        <blockquote>"When I joined the program a year ago I tested healthy but was tired and miserable. ... With Doctor Lori's compassionate and patient help, I have walked through tests and improvements that cannot be discovered in a 30-minute annual physical box, to now be armed with enough information about ME to really have a fighting chance at health. Even on the days I couldn't remember all the right words, she has listened and truly cared."</blockquote>
        <figcaption><strong>L. Craig</strong> · PEAK patient</figcaption>
        <a href="/patient-stories/#l-craig">Read her full story</a>
      </figure>
      <div class="step"><span class="k">Weeks 3 to 4</span><h2>Analysis and protocol</h2><p>Your physician reviews everything, then sits down with you for a full Review of Findings. Together you build a protocol targeting the specific root causes the testing found in you.</p></div>
      <div class="step"><span class="k">Months 2 to 7</span><h2>The climb</h2><p>One educational module each week, 26 in total, across six monthly Basecamps covering inflammation, mitochondrial health, cellular energy, autophagy, and lifelong brain health. Expect about an hour a week to read and think it through. The action steps happen inside the life you already have.</p></div>
      <div class="step"><span class="k">Every month</span><h2>Physician visit</h2><p>A one-on-one virtual visit with Dr. Lori or Dr. Chris to adjust your protocol, review supplements, and answer questions. Between visits, you can message your physician directly, any time.</p></div>
    </div>
  </section>
  <section class="section section-paper" id="biomarkers">
    <div class="wrap narrow">
      <h2>Four brain biomarkers, from a blood draw</h2>
      <p>Most brain-health programs never look directly at the brain. We do, with four blood biomarkers that together give a picture of what is happening in your nervous system right now. They are one part of a larger work-up. Metabolic health, gut, hormones, nutrients, cellular energy, and, depending on your tier, genetics and toxic exposures are measured alongside them because those systems influence what the brain markers eventually show.</p>
      <ul class="markers">
        <li><strong>p-Tau 217:</strong> the most reliable blood marker we have for Alzheimer's-type changes in the brain</li>
        <li><strong>Amyloid beta 42/40 ratio:</strong> whether amyloid is accumulating, and to what degree</li>
        <li><strong>NfL (neurofilament light):</strong> a signal of nerve cell injury anywhere in the nervous system</li>
        <li><strong>GFAP:</strong> a measure of inflammation in the brain's support cells</li>
      </ul>
      <p>No single one of these tells the whole story. Read together, they tell us whether anything is happening beneath the surface, years before it would show up in how you think or feel.</p>
      <p>Most people go their entire lives without ever knowing where they actually stand. You do not have to be one of them.</p>
      <p>At six months, you finish with a PEAK Graduation Session: a full look at what changed and what comes next. Most graduates continue with us into PEAK Ascent, our Year 2 program. That is a decision for later, not now.</p>
      <p class="note">A detailed breakdown of each monthly Basecamp and a full comparison of testing tiers is part of what we walk you through at your consultation.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <h2>What happens at the consultation</h2>
      <div class="bda">
        <div><div class="k">Before</div><strong>30 minutes</strong><p>Your health and lifestyle history</p></div>
        <div><div class="k">During</div><strong>1 full hour, 1:1</strong><p>With a physician</p></div>
        <div><div class="k">After</div><strong>Your choice</strong><p>Begin that day if it is right</p></div>
      </div>
      <div class="narrow">
        <p>Before we meet, you will complete a detailed health and lifestyle history. It takes about thirty minutes and it covers ground a standard intake never touches: sleep, stress, diet, exposures, medications, family patterns, and the things you have noticed but never mentioned to a doctor.</p>
        <p>Then we spend a full hour together, one to one, with a physician. We go through your history properly and begin identifying the risk factors that are specific to you.</p>
        <p><strong>No pressure, and no obligation.</strong> Whether or not you ever enroll, you will leave this hour knowing more about your brain than you ever have: your risk factors, what is already protecting you, and what you can start doing today.</p>
        <div class="price-callout">
          <strong>$350, credited in full toward your program if you enroll</strong>
          <p>Refundable up to 48 hours before your appointment.</p>
        </div>
        <p>An hour of physician time with your complete health history is real clinical work, and we would rather do it properly than run free calls that serve no one well. If you join us, it costs you nothing in the end.</p>
        <div class="actions"><a class="btn" href="/consultation/">Book Your Consultation</a></div>
      </div>
    </div>
  </section>
</main>
"""

# FAQ pairs: question, answer. Used for visible HTML and FAQPage schema.
FAQ = [
    ("Do I need to have memory problems to start?", "No. The best time is before anything shows. Most PEAK patients come because they want to keep it that way, often after watching a parent decline."),
    ("Why can't I just ask my regular doctor about this?", "For many of you, we are your regular doctor, which is why we can answer this honestly. A standard fifteen-minute visit billed to insurance was never built to include four-marker brain biomarker testing, a full root-cause work-up, or six months of physician time. That is a limitation of the payment model, not of the physician. PEAK exists as a separate program to do the work a normal visit cannot."),
    ("What is cognitive longevity?", "Cognitive longevity is the practice of supporting how your brain functions for as long as possible. It means finding and working on measurable factors, often years before symptoms appear, instead of waiting for a diagnosis."),
    ("How is this different from a traditional doctor's visit?", "A traditional visit is short, symptom-driven, and built around insurance billing codes. PEAK is six months long, starts with advanced testing rather than a checklist of complaints, and gives you direct, ongoing access to the physician building your protocol."),
    ("Do I have to live near Southlake? How does the virtual program work?", "No. PEAK is built to work virtually. Testing is done largely from home, and your monthly visits with Dr. Lori or Dr. Chris happen over video. Patients join us from outside Southlake regularly. Call us to confirm availability in your state."),
    ("Why isn't this covered by insurance?", "Insurance pays to treat disease once it is diagnosed. It does not pay for the advanced testing, protocol development, or physician time this early work takes. Filing insurance would mean building PEAK around what a payer approves rather than what the evidence supports, and we were not willing to do that."),
    ("What if I'm already a Timarron Family Medicine patient?", "PEAK is a separate program from your regular Timarron Family Medicine care, with its own testing, protocol, and schedule of visits. Being an existing patient does not change the cost or process, but it does mean you are already working with a physician you know."),
    ("How much time does this take each week?", "About an hour a week for the module itself. That is the reading and thinking it through. The action steps live inside the life you already have: what you eat, how you sleep, how you move, rather than added on top of it. You also have one virtual visit with your physician each month."),
    ("What happens at the consultation, and why does it cost $350?", "The consultation is a full hour, one to one, with Dr. Lori or Dr. Chris. Not a coordinator, and not a sales call. It is the first hour of the work itself. The $350 is credited in full toward your program if you enroll, and it is refundable up to 48 hours before your appointment."),
    ("Can my spouse and I do this together?", "Yes. Book two consultations back to back on the same day and the second consultation is free. If you both enroll, each person receives $500 off, even if you choose different tiers. Everything else remains separate: your own testing, physician visits, and protocol."),
    ("What is the health history form, and how long does it take?", "It is a detailed intake covering ground a standard visit never touches: sleep, stress, diet, exposures, medications, and family patterns. It takes about thirty minutes and you will complete it before your consultation."),
    ("I carry APOE4 or have a parent with dementia. Is it too late?", "Genes load the dice. Biology and lifestyle shape how they roll. Dr. Lori carries very high genetic risk herself, and has lowered her biological age by more than 10 years."),
    ("What if a result is hard to hear?", "Every result arrives with a plan and a physician beside you. We look for risks so we can work on them, not to deliver a verdict."),
    ("What happens after the six months?", "You finish with a PEAK Graduation Session: a full look at what changed and what is next. Most graduates continue with us into PEAK Ascent, our year-two program, but that is a conversation for after you have seen your own results, not before."),
    ("Do I have to take supplements?", "Not necessarily. Your protocol is built around what your testing actually shows. For some patients that includes targeted supplementation. For others the priority is sleep, nutrition, or movement. Your physician will walk you through what is recommended for you and why."),
    ("Am I too late for this to help?", "The earlier you start, the more you can change. The risk factors that drive cognitive decline remain modifiable into the seventies and eighties, and blood pressure, blood sugar, sleep, hearing, and inflammation still respond at any age. What changes with age is not whether this work is useful. It is what we prioritize, and how quickly we want to see the numbers move."),
]


def faq_body():
    items = []
    for question, answer in FAQ:
        items.append(f"<details class=\"faq\"><summary>{e(question)}</summary><p>{e(answer)}</p></details>")
    return f"""
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">Questions people ask before booking</p>
      <h1>Questions, answered honestly.</h1>
      <p class="lede">Clear answers about the PEAK program, testing, time, and what to expect.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap narrow">
      {''.join(items)}
      <div class="actions">
        <a class="btn" href="/consultation/">Book Your Consultation</a>
        <a class="btn btn-line" href="/contact/">Contact us</a>
      </div>
    </div>
  </section>
</main>
"""


def faq_schema():
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ
        ],
    }


PRICING = """
<main id="main">
  <section class="page-intro">
    <div class="wrap split">
      <div>
        <p class="eyebrow">Pricing</p>
        <h1>Make the climb work for you.</h1>
        <p class="lede">PEAK is paid out of pocket. Insurance does not cover this kind of early, root-cause program. We offer clear options so payment never obscures the decision you are making.</p>
      </div>
      <img src="/assets/photos/mountains-pink-flowers.jpg" alt="Mountain meadow with pink wildflowers" width="1400" height="900">
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <h2>Your investment in your brain's future</h2>
      <p class="narrow">PEAK is a six-month, physician-led program. Every package includes your Review of Findings, a personalized protocol, six monthly Basecamps with 26 weekly modules, a one-to-one virtual visit with your physician every month, anytime secure messaging, and your PEAK Graduation. Packages differ in how deep the testing goes.</p>
      <figure class="review">
        <blockquote>"My healing wasn't an overnight success story. It took an investment of three to four months, but the lasting, tangible results became clear evidence that my healing journey had begun."</blockquote>
        <figcaption><strong>Yvonne B.</strong> · PEAK patient</figcaption>
        <a href="/patient-stories/#yvonne">Read the full review</a>
      </figure>
      <div class="table-wrap" role="region" aria-label="Program pricing and testing comparison" tabindex="0">
        <table class="prices">
          <caption>Program pricing and included services</caption>
          <thead><tr><th scope="col">Package feature</th><th scope="col">Silver</th><th scope="col">Gold</th><th scope="col">Executive</th></tr></thead>
          <tbody>
            <tr><th scope="row">Program price</th><td>$7,529</td><td>$8,673</td><td>$10,024</td></tr>
            <tr><th scope="row">Paid by cash or check</th><td>$7,239</td><td>$8,339</td><td>$9,638</td></tr>
            <tr><th scope="row">Four brain biomarkers (p-Tau 217, amyloid beta 42/40, NfL, GFAP)</th><td>Included</td><td>Included</td><td>Included</td></tr>
            <tr><th scope="row">Comprehensive metabolic blood panel</th><td>Included</td><td>Included</td><td>Included</td></tr>
            <tr><th scope="row">NAD+ cellular energy testing</th><td>Included</td><td>Included</td><td>Included</td></tr>
            <tr><th scope="row">Neurotransmitter and hormone evaluation</th><td>Included</td><td>Included</td><td>Included</td></tr>
            <tr><th scope="row">Total Toxin Burden Analysis (environmental toxins, mold, heavy metals)</th><td>Not included</td><td>Included</td><td>Included</td></tr>
            <tr><th scope="row">Professional cognitive performance testing</th><td>Not included</td><td>Included</td><td>Included</td></tr>
            <tr><th scope="row">IntellxxDNA Brain Optimization Panel (500+ genetic variants)</th><td>Not included</td><td>Not included</td><td>Included</td></tr>
            <tr><th scope="row">Monthly 1:1 physician visits, weekly modules, messaging, graduation</th><td>Included</td><td>Included</td><td>Included</td></tr>
          </tbody>
        </table>
      </div>
      <p class="note">Swipe sideways on a phone to see every package. Supplements are not included and are purchased separately as your protocol requires. Your $350 consultation fee is credited in full toward any package. Testing varies by package. Your physician can review the specific testing included with each option.</p>
      <div class="pay-grid">
        <article>
          <h3>Pay in full</h3>
          <p>Most patients pay at enrollment. Payment by actual cash or check qualifies for the lower price shown above. Debit and credit card payments are charged at the regular price.</p>
        </article>
        <article>
          <h3>0% financing with Cherry</h3>
          <p>Spread your investment over 6 to 12 months at 0% APR for qualifying applicants.</p>
          <div class="cherry">
            <div>
              <a class="btn" href="https://pay.withcherry.com/peakcognitivelongevity" target="_blank" rel="noopener noreferrer">Apply with Cherry</a>
              <p class="note">Checking your options takes a couple of minutes and does not affect your credit score.</p>
            </div>
            <figure>
              <img src="/assets/cherry/cherry-apply-qr.svg" width="175" height="175" alt="QR code to apply for Cherry financing">
              <figcaption>Scan to apply on your phone.</figcaption>
            </figure>
          </div>
        </article>
        <article>
          <h3>HSA and FSA</h3>
          <p>Many patients use HSA or FSA funds. We cannot promise your plan will qualify, but we are happy to provide documentation.</p>
        </article>
        <article>
          <h3>Couples</h3>
          <p>Book your consultations back to back on the same day, and the second is free. If you both enroll, you each receive $500 off, at any tier. You do not have to choose the same package.</p>
          <p><strong>Bring someone who matters to you.</strong> A spouse, adult child, trusted friend, or other decision-maker is welcome. Your spouse's own consultation is free when booked back to back with yours.</p>
        </article>
      </div>
      <div class="actions"><a class="btn" href="/consultation/">Book Your Consultation</a><a class="btn btn-line" href="/contact/">Ask a question</a></div>
    </div>
  </section>
</main>
"""

CONTACT = """
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">Contact</p>
      <h1>Let us start the conversation.</h1>
      <p class="lede">Whether you have questions about the program, want to know if PEAK is a fit, or are ready to schedule a consultation, the team is a message away.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap contact-layout">
      <form class="card" id="contact-form">
        <h2>Send us a message</h2>
        <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" type="text" autocomplete="name" maxlength="120" required></div>
        <div class="field"><label for="c-phone">Phone (required)</label><input id="c-phone" name="phone" type="tel" autocomplete="tel" maxlength="40" required></div>
        <div class="field"><label for="c-email">Email (required)</label><input id="c-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>
        <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="5" maxlength="5000" required placeholder="Tell us how we can help. Please do not include sensitive medical information."></textarea></div>
        <div class="hp" aria-hidden="true">
          <label for="c-website">Leave this field empty</label>
          <input id="c-website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        <p>For general questions only. Please do not include medical records or sensitive health information. For urgent medical concerns, contact your clinician; for emergencies, call 911.</p>
        <div id="contact-captcha" aria-label="Google reCAPTCHA verification"></div>
        <p id="captcha-status" role="status" aria-live="polite">Loading verification...</p>
        <button class="btn" type="submit">Send Message</button>
        <p id="contact-status" role="status" aria-live="polite" aria-atomic="true" hidden></p>
      </form>
      <aside class="info">
        <div class="field"><div class="label">Phone</div><p><a href="tel:+18177965115">(817) 796-5115</a></p></div>
        <div class="field"><div class="label">Email</div><p><a href="mailto:team@peakcognitivelongevity.com">team@peakcognitivelongevity.com</a></p></div>
        <div class="field"><div class="label">Office</div><p>200 Pecan Creek Drive<br>Southlake, TX 76092<br><a href="https://www.google.com/maps/search/?api=1&amp;query=200+Pecan+Creek+Drive%2C+Southlake%2C+TX+76092">View on Google Maps</a></p></div>
        <div class="field"><div class="label">Hours</div><p>Mon to Thu, 8:00 AM to 4:30 PM<br>Fri, 8:00 AM to 12:00 PM</p></div>
        <p>We typically respond within one business day.</p>
        <p><a href="/consultation/">Prefer to book now? Schedule your consultation.</a></p>
      </aside>
    </div>
  </section>
</main>
"""

EBOOK = """
<main id="main">
  <section class="page-intro">
    <div class="wrap ebook-layout">
      <div>
        <p class="eyebrow">Free e-book from Dr. Lori King, MD</p>
        <h1>Food Fight</h1>
        <p class="lede">Win the battle for your waistline, your health, and your brain.</p>
        <p>Weight gain, chronic disease, and memory loss are not three separate problems. They share the same four root causes, and food feeds all four. This free guide shows you how to work on all three from your plate, one small swap at a time.</p>
        <p class="note">166 pages · 26 short chapters · recipes in every chapter</p>
        <div class="actions"><a class="btn" href="#ebook-signup">Send Me the Free E-book</a><a class="btn btn-line" href="/blog/">Read the blog</a></div>
      </div>
      <img class="ebook-cover" src="/assets/photos/food-fight-ebook-cover.jpg" alt="Food Fight e-book cover by Dr. Lori King, MD" width="600" height="800">
    </div>
  </section>
  <section class="section section-paper">
    <div class="wrap narrow">
      <h2>What's inside</h2>
      <ul class="highlights">
        <li>Why cutting sugary drinks is the easiest first win, and what changes when you do</li>
        <li>The leafy-greens habit linked to brains that performed about 11 years younger</li>
        <li>How to quit sugar, and what to expect in the first week</li>
        <li>Ultra-processed foods, dementia risk, and the simple 5-ingredient rule</li>
        <li>Which fish give you brain-building omega-3s without the mercury</li>
        <li>The truth about fruit, dairy, red meat, eggs, soy, and cooking oils</li>
        <li>Fermented and prebiotic foods that feed a healthier gut</li>
        <li>Portion control without counting, and why late-night eating works against you</li>
      </ul>
      <p><strong>Read it front to back, or jump to the chapter that is calling your name.</strong> Each chapter ends with simple next steps, a safety check, and a recipe or two. Small swaps, repeated, are how the changes add up.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap narrow">
      <h2>About Dr. Lori King</h2>
      <p>Dr. Lori King, MD, is the founder of PEAK Cognitive Longevity at Timarron Family Medicine in Southlake, Texas. A conventionally trained family physician, she retrained in root-cause and longevity medicine after losing a parent to dementia.</p>
      <p><em>Food Fight</em> is the guide she wishes every patient had: practical, evidence-based, and written so you can actually use it.</p>
    </div>
  </section>
  <section class="section section-paper" id="ebook-signup">
    <div class="wrap">
      <div class="signup">
        <h2>Get your free copy</h2>
        <p>Enter your name and email, and we will send <em>Food Fight</em> straight to your inbox.</p>
        <iframe id="inline-JvGwX8MG7DenmjwVKses" title="Food Fight e-book signup"></iframe>
        <p class="note">If the signup form does not load, please call <a href="tel:+18177965115">(817) 796-5115</a> or email <a href="mailto:team@peakcognitivelongevity.com">team@peakcognitivelongevity.com</a> for help.</p>
        <p class="note">We respect your privacy. You can unsubscribe at any time.</p>
        <p class="note">This e-book is for educational purposes and is not a substitute for personal medical advice.<br>PEAK Cognitive Longevity · Timarron Family Medicine · 200 Pecan Creek Drive, Southlake, TX 76092 · (817) 796-5115</p>
      </div>
    </div>
  </section>
</main>
"""

CONSULT = f"""
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">Consultation</p>
      <h1>Ready to find out where you actually stand?</h1>
      <p class="lede">A one-hour consultation with Dr. Lori or Dr. Chris, one to one.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="bda">
        <div><div class="k">Before</div><strong>30 minutes</strong><p>Your health and lifestyle history</p></div>
        <div><div class="k">During</div><strong>1 full hour, 1:1</strong><p>With a physician</p></div>
        <div><div class="k">After</div><strong>Your choice</strong><p>Begin that day if it is right</p></div>
      </div>
      <div class="narrow">
        <p>Before we meet, you will complete a detailed health and lifestyle history. It takes about thirty minutes and covers sleep, stress, diet, exposures, medications, family patterns, and the things you have noticed but never mentioned to a doctor.</p>
        <p>Then we spend a full hour together, one to one, with a physician. Real questions get real answers.</p>
        <p><strong>No pressure, and no obligation.</strong> Whether or not you ever enroll, you will leave this hour knowing more about your brain than you ever have: your risk factors, what is already protecting you, and what you can start doing today.</p>
        <div class="price-callout">
          <strong>$350, credited in full toward your program if you enroll</strong>
          <p>Refundable up to 48 hours before your appointment.</p>
        </div>
        <h2>Bring the people who matter to you</h2>
        <p>Decisions about your health are rarely made alone, and they do not have to be. You are warmly welcome to bring your spouse, an adult son or daughter, a trusted friend, or anyone who helps you make important decisions. They can join your consultation, ask their own questions, and hear every answer firsthand, so you can decide together with confidence.</p>
        <p>If your spouse would like a consultation of their own, book it back to back with yours on the same day. The second consultation is free.</p>
        <div class="actions">
          <a class="btn" href="{BOOK}" target="_blank" rel="noopener">Book Your Consultation</a>
          <a class="btn btn-line" href="tel:+18177965115">Call (817) 796-5115</a>
          <a class="btn btn-line" href="/contact/">Email us</a>
        </div>
        <p class="note"><a href="/pricing/">See program prices and payment options</a> · <a href="/ebook/">Get the free e-book while you decide</a></p>
      </div>
    </div>
  </section>
</main>
"""

STORIES = """
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">From our patients</p>
      <h1>Patient stories</h1>
      <p class="lede">In their own words: what our patients have shared about their PEAK experience.</p>
      <p>These are our patients' own words about their personal experiences. Individual results vary. PEAK Cognitive Longevity does not diagnose, treat, or cure dementia or Alzheimer's disease.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap narrow">
      <article class="story" id="l-craig">
        <h2>L. Craig</h2>
        <p class="role">PEAK patient</p>
        <p class="pull">Dr. Lori is willing to sit down and spend enough quality time actually listening and caring about me to do whatever it takes and find the ROOT causes! ... I finally have hope. I watched both parents die an inch at a time and I no longer feel swept up into my inevitable. Now I have a fighting chance to change everything.</p>
        <h3>One year in</h3>
        <p>I highly recommend the Peak Cognitive Longevity program. When I joined the program a year ago, I tested healthy but was tired and miserable. Although I had zero clogging in my arteries, the inflammation around my heart, which needs to come within an acceptable range of 1 to 3, was a 17! I was poised for a catastrophic event. I really didn't have a choice but to join.</p>
        <p>With Doctor Lori's compassionate and patient help, I have walked through tests and improvements that cannot be discovered in a 30-minute annual physical box, to now be armed with enough information about ME to really have a fighting chance at health. Even on the days I couldn't remember all the right words, she has listened and truly cared. It's so rare, I barely know how to express it! I thought I couldn't afford it, but I can only imagine what that heart attack would have cost!!</p>
        <h3>When she first joined</h3>
        <p>I am an active member in my pursuit of health and have been for many years. Along with putting substantial research in my pursuit of a family practitioner, I have always had a functional medicine doc. I have been constant in my use of supplements and health advisories, healthy eating plans, etc. Yet after all of that, I found myself triggered for a major health event in several areas because of what I didn't know. This is what led me to join Peak Cognitive Longevity with Dr. Lori King. She leaves no stone unturned in areas such as reversing brain fog, release from heavy metals, discovering your unique biomarkers, and protecting you from your own genetics, in my case two parents with Alzheimer's.</p>
        <p>For years I have felt like I was all alone trying to balance seemingly conflicting info on how to stop unexplainable fatigue and gross inflammation, hair loss and weight gain just for starters.</p>
        <p>This Peak Longevity program is a perfect blend. No, it's more than that. It's quite literally a life saver! The one you always hoped for but thought you'd never find, the best of medical expertise and experience blended with alternative medicine, where I, quite frankly, had seen more results with natural supplements instead of drugs with laundry lists of side effects! I longed for facts on my health based on real tests that did NOT merely throw drugs at the symptoms!! FINALLY!! Peak Cognitive Longevity, more specifically Dr. Lori, is willing to sit down and spend enough quality time actually listening and caring about me to do whatever it takes and find the ROOT causes! I don't know if I have ever met someone with more compassion and resolve to help.</p>
        <p>I wish I could express this better but let me sum it up by saying this. I finally have hope. I watched both parents die an inch at a time and I no longer feel swept up into my inevitable. Now I have a fighting chance to change everything.</p>
      </article>
      <article class="story" id="yvonne">
        <h2>Yvonne B.</h2>
        <p class="role">PEAK patient</p>
        <p class="pull">I initially sat in on my husband's consultation with Dr. Lori King, never expecting that by the end of the appointment, I would sign up too. ... I encourage anyone who has ever been told by a doctor, as I was, that "that's your lot in life" to have a conversation with Dr. Lori King. There is hope, and there are answers.</p>
        <p>I initially sat in on my husband's consultation with Dr. Lori King, never expecting that by the end of the appointment, I would sign up too. I came to understand just how deeply connected our brain and gut health really are.</p>
        <p>I had struggled with gut issues for 50 years, and it was only through Dr. King's thorough testing that significant underlying issues were finally discovered. My healing wasn't an overnight success story. It took an investment of three to four months, but the lasting, tangible results became clear evidence that my healing journey had begun.</p>
        <p>Fine-tuning my supplements, adjusting the timing of my meals, and getting my sleep cycles back on track have been life-changing, to say the least. Some of my issues are genetic and will remain with me for life, but with Dr. King's guidance, they are now so much more manageable. Other issues have resolved completely.</p>
        <p>I encourage anyone who has ever been told by a doctor, as I was, that "that's your lot in life" to have a conversation with Dr. Lori King. There is hope, and there are answers. We simply need someone willing to look deeper and help us find a different path forward. That person for me was Dr. King.</p>
        <p>For me, faith and healing go hand in hand. Dr. Lori King has given me renewed hope and real, meaningful results. Joining Peak Longevity has truly transformed my wellness and, more importantly, how I am able to live my life.</p>
      </article>
      <article class="story" id="anonymous">
        <h2>Anonymous</h2>
        <p class="role">PEAK patient</p>
        <p>Peak Longevity has truly been life-changing for me. Before starting the program, I felt sluggish, dealt with daily brain fog, and honestly didn't feel like myself. Since joining Peak Longevity, that has completely changed. I feel energized, clear-headed, and like me again. The information and guidance Dr. Lori provides have been invaluable, and the monthly check-ins are a huge part of what makes the program so successful. They keep me accountable, supported, and moving forward. I'm incredibly grateful for the impact this program has had on my overall well-being.</p>
      </article>
      <article class="story" id="barbara">
        <h2>Barbara M.</h2>
        <p class="role">PEAK patient</p>
        <p>We are impressed with the knowledge and care provided by Dr. Lori. Embarking on this health journey to longevity will be easier with her guidance and counsel. Thank you for developing this program to help us navigate our "golden years" and make them more healthy!</p>
      </article>
      <div class="actions">
        <a class="btn" href="/consultation/">Book Your Consultation</a>
        <a class="btn btn-line" href="/contact/">Contact us</a>
      </div>
    </div>
  </section>
</main>
"""

RESOURCES = """
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">For current patients</p>
      <h1>Ordering and resources</h1>
      <p class="lede">These are the kinds of pharmacies and suppliers we use with PEAK patients. Products in this space vary a great deal in quality, and these are the sources we trust for what we prescribe.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap narrow prose">
      <p>You should know that our practice may receive compensation or a margin on products ordered through these partners. Our recommendations are made on clinical grounds regardless, and nothing we suggest depends on where you choose to buy it. You are always free to fill any recommendation elsewhere.</p>
      <div class="cards">
        <article class="card">
          <h2>Practice dispensary</h2>
          <p>This is where most PEAK supplement protocols are filled. After your physician builds your protocol, the team sends ordering instructions. We do not send you to sort product quality on your own.</p>
        </article>
        <article class="card">
          <h2>Pharmacy partners</h2>
          <p>Some protocols use practitioner-grade formulations from pharmacy partners. Registration is handled with the PEAK team.</p>
        </article>
      </div>
      <p>If you need help placing an order, call <a href="tel:+18177965115">(817) 796-5115</a> or email <a href="mailto:team@peakcognitivelongevity.com">team@peakcognitivelongevity.com</a>.</p>
      <div class="actions"><a class="btn" href="/contact/">Contact the team</a></div>
    </div>
  </section>
</main>
"""


def clean_blurb(text):
    text = text.replace("\u2014", ", ").replace("\u2013", "-").replace("—", ", ").replace("–", "-")
    return " ".join(text.split())


def blog_body():
    fight = json.loads((ROOT / "assets/food-fight-blog-index.json").read_text())
    pearls = json.loads((ROOT / "assets/longevity-pearls-blog-index.json").read_text())
    fight.sort(key=lambda post: post["seriesNumber"])

    def items(posts):
        rows = []
        for post in posts:
            blurb = clean_blurb(post.get("description") or post.get("excerpt") or "")
            search = e((post["title"] + " " + blurb).lower())
            rows.append(
                f'<li data-search="{search}"><a href="/blog/{e(post["slug"])}/">{e(post["title"])}</a>'
                f'<p>{e(blurb)}</p><p class="meta">{e(post.get("author", "Lori King, MD"))}'
                + (f' · {int(post["readingTime"])} min read' if post.get("readingTime") else "")
                + "</p></li>"
            )
        return "\n".join(rows)

    return f"""
<main id="main">
  <section class="page-intro">
    <div class="wrap narrow">
      <p class="eyebrow">From the physicians</p>
      <h1>Learn more about your brain</h1>
      <p class="lede">Practical writing on food, habits, and brain health from Dr. Lori King, MD, and Dr. Chris King, MD.</p>
      <div class="cards cards-3">
        <article class="card">
          <a href="/blog/food-fight-weight-loss-chronic-disease-brain-health/"><img src="/assets/photos/food-fight-ebook-cover.jpg" alt="Food Fight e-book cover by Dr. Lori King, MD" width="600" height="800"></a>
          <h3><a href="/blog/food-fight-weight-loss-chronic-disease-brain-health/">How diet affects weight, disease, and brain health</a></h3>
        </article>
        <article class="card">
          <a href="/blog/morning-sunlight-brain-health/"><img src="/assets/photos/Mountain%20Sunrise%20Sun%20Beams.jpg" alt="Sunlight breaking over a mountain ridge at sunrise" width="1400" height="900"></a>
          <h3><a href="/blog/morning-sunlight-brain-health/">Morning sunlight and brain health</a></h3>
        </article>
        <article class="card">
          <a href="/blog/morning-exercise-brain-health/"><img src="/assets/photos/Mountain-Trail-Sunrise.jpg" alt="A quiet mountain trail at sunrise" width="1600" height="1067"></a>
          <h3><a href="/blog/morning-exercise-brain-health/">A simple morning movement habit</a></h3>
        </article>
      </div>
      <div class="blog-tools">
        <label for="blog-search">Search articles</label>
        <input id="blog-search" type="search" placeholder="Search by topic">
      </div>
      <p id="blog-empty" hidden>No matching articles.</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="blog-group">
        <h2>The Food Fight series</h2>
        <p>Short chapters from the <a href="/ebook/">Food Fight e-book</a>, published as articles you can read one at a time.</p>
        <ul class="post-list">{items(fight)}</ul>
      </div>
      <div class="blog-group">
        <h2>Longevity Pearls</h2>
        <p>Short, practical notes from Dr. Lori on daily habits.</p>
        <ul class="post-list">{items(pearls)}</ul>
      </div>
      <div class="actions">
        <a class="btn" href="/ebook/">Get the Free E-book</a>
        <a class="btn btn-line" href="/consultation/">Book Your Consultation</a>
      </div>
    </div>
  </section>
</main>
"""


def main():
    page("/", "Your Sharpest Years Are Still Ahead | PEAK Cognitive Longevity",
         "A six-month physician-led program in Southlake, TX, and by video nationwide, for adults who want to stay sharp.",
         "home", HOME, [clinic_schema(), LORI, CHRIS])
    page("/about/", "Our Story | PEAK Cognitive Longevity",
         "Dr. Lori King and Dr. Chris King each lost a parent to dementia. They built PEAK at Timarron Family Medicine.",
         "about", ABOUT, [clinic_schema(), LORI, CHRIS], f"{ORIGIN}/assets/photos/Lori-with-Dad.jpg")
    page("/program/", "The PEAK Program | PEAK Cognitive Longevity",
         "What the six-month PEAK program includes: testing, a personal protocol, weekly modules, and monthly physician visits.",
         "program", PROGRAM)
    page("/faq/", "Questions About PEAK | PEAK Cognitive Longevity",
         "Common questions about PEAK, testing, time, the $350 consultation, couples, and how payment works.",
         "faq", faq_body(), [clinic_schema(), faq_schema()])
    page("/pricing/", "Pricing and Payment Options | PEAK Cognitive Longevity",
         "Silver, Gold, and Executive program prices, cash or check savings, financing, and the couple discount.",
         "pricing", PRICING)
    page("/contact/", "Contact Us | PEAK Cognitive Longevity",
         "Call (817) 796-5115 or email team@peakcognitivelongevity.com. 200 Pecan Creek Drive, Southlake, TX 76092.",
         "contact", CONTACT)
    page("/ebook/", "Free Food Fight E-book | PEAK Cognitive Longevity",
         "Get Food Fight, the free guide from Dr. Lori King, MD, with practical food swaps for health and brain health.",
         "ebook", EBOOK, [clinic_schema()], f"{ORIGIN}/assets/photos/food-fight-ebook-cover.jpg")
    page("/blog/", "Blog | PEAK Cognitive Longevity",
         "Food Fight articles and Longevity Pearls from Dr. Lori King, MD, on food, habits, and brain health.",
         "blog", blog_body())
    page("/consultation/", "Book Your Consultation | PEAK Cognitive Longevity",
         "One hour with Dr. Lori or Dr. Chris. The $350 fee is credited toward PEAK if you enroll.",
         "consultation", CONSULT)
    page("/patient-stories/", "Patient Stories | PEAK Cognitive Longevity",
         "PEAK patients share their own experiences. Stories use first name and last initial. Results vary.",
         "stories", STORIES)
    page("/resources/", "Ordering and Resources | PEAK Cognitive Longevity",
         "How PEAK patients order supplements through the practice dispensary and pharmacy partners.",
         "resources", RESOURCES)


if __name__ == "__main__":
    main()
