# Contact form: Vercel + Resend

The website posts contact questions to `/api/contact`. Vercel runs
`api/contact.js`, which sends a plain-text email through Resend to
**team@peakcognitivelongevity.com**. The visitor's email is the Reply-To address.
Visitors do not need an email app. There are no additional npm dependencies.

## Required before launch

1. Create a [Resend account](https://resend.com) and add a sending domain in its
   Domains dashboard. A dedicated subdomain such as
   `mail.peakcognitivelongevity.com` can separate website sending from your
   existing email service.
2. Add the DNS records Resend provides at your domain's DNS provider. Wait for
   verification. Do not replace the existing MX records for your team's inbox.
   Resend's default test sender is not suitable for delivering to the team inbox.
3. Create a Resend API key with sending access to that domain.
4. In Vercel, import this GitHub repository. Use the repository root, Framework
   Preset **Other**, no build command, and the root/static output directory
   (not a nonexistent `dist` folder). Vercel automatically deploys the `api`
   directory as Node.js functions alongside the static website.
5. In Vercel's Project Settings > Environment Variables, set:
   - `RESEND_API_KEY`: your private Resend key.
   - `CONTACT_FROM_EMAIL`: a plain address on the verified domain, such as
     `website@mail.peakcognitivelongevity.com`. Do not use the visitor's address.
   - `CONTACT_ALLOWED_ORIGINS`, if needed: comma-separated exact origins,
     such as `https://your-project.vercel.app`, without paths or trailing slashes.
6. Enable the variables for Production and any Preview environments you intend
   to test. Redeploy after adding or changing them.
7. Connect your domain to Vercel. The apex and `www` origins for
   `peakcognitivelongevity.com` are already allowed. The current Vercel deployment
   hostname is also allowed automatically; add stable aliases explicitly.
8. Configure a Vercel Firewall rate-limit rule for POST requests to
   `/api/contact` (for example, five requests per minute per IP, if supported by
   your plan). Test it and monitor traffic and Resend usage. The form has a
   honeypot and origin checks, but these do not replace rate limiting or a
   CAPTCHA for sustained abuse.

Never paste API keys into chat, HTML, or GitHub. `.env.example` contains only
variable names; local `.env` files and Vercel-generated files are ignored.

## Verification

Run the automated checks with Node.js 22 or later:

```powershell
node --test scripts\contact.test.js
```

For local function testing, run `vercel dev` with the Vercel CLI and local
environment variables (allow its exact localhost origin). A plain static
server cannot run `/api/contact`.

After deployment, submit a non-sensitive test question:

- Confirm a submission acknowledgement appears without opening an email app.
- Confirm the actual email arrives at the team inbox, including spam checks.
- Reply to it and confirm the reply targets the visitor's email.
- Check Resend delivery events. API acceptance does not guarantee inbox delivery.
- Confirm invalid fields are rejected and a failed request keeps the visitor's
  entries and displays contact alternatives.

Do not consider live delivery verified until the inbox test passes. With missing
configuration the endpoint returns an explicit error, never a success message.

## Privacy and scope

This is a general-inquiry form, not a medical-record submission portal. Its text
asks visitors not to include sensitive health information or emergency requests.
Resend processes the contact details and message; review its terms, retention,
and your privacy policy before launch. No form contents or credentials are
written to application logs. Do not use this flow for protected health
information without an appropriate compliance review.
