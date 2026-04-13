# StayMain - Website Specification

## Concept & Vision

A premium, professional web agency website inspired by WeWork's design aesthetic. Clean, confident, and modern with bold typography, smooth interactions, and an immersive interactive hero experience. The site should feel like a high-end digital agency that commands trust and expertise.

## Design Language

### Color Palette
- Primary: `#2563EB` (bright blue)
- Background Light: `#FFFFFF`
- Background Dark: `#0F172A`
- Background Subtle: `#F8FAFC`
- Text Primary: `#0F172A`
- Text Secondary: `#64748B`

### Typography
- Headings: Libre Baskerville (300)
- Body: DM Sans (400, 500, 600)

## Tech Stack
- Next.js 14
- Tailwind CSS
- TypeScript
- Lucide React (icons)

## Pages

### Navigation Structure
1. **Ydelser** (dropdown menu)
   - Hjemmeside → `/ydelser/hjemmeside`
   - Webshop → `/ydelser/webshop`
   - Appudvikling → `/ydelser/appudvikling`
   - Support & Hosting → `/ydelser/support-hosting`
   - SEO → `/ydelser/seo`
   - Meta Ads → `/ydelser/meta-ads`
   - E-mail Marketing → `/ydelser/email-marketing`
   - Foto & Video → `/ydelser/foto-video`
   - Grafisk Design → `/ydelser/grafisk-design`
2. **Cases** → `/cases`
3. **Om os** → `/om-os`
4. **FAQ** → `/ofte-stillede-spørgsmål`

### Page List
- `/` - Homepage (Hero, Services, Testimonials)
- `/ydelser` - Services overview
- `/ydelser/[slug]` - Individual service pages
- `/cases` - Portfolio/cases
- `/om-os` - About us
- `/ofte-stillede-spørgsmål` - FAQ
- `/kontakt` - Contact page (TODO)

## Features

### Interactive Hero
- Mouse-following gradient orbs (3 orbs)
- Grid pattern overlay
- Smooth parallax effect
- Stats counter section

### Navigation
- Sticky with blur backdrop on scroll
- Logo left, links center, CTA right (desktop)
- Services dropdown menu
- Mobile hamburger menu with submenu
- Dark mode toggle
- Language toggle (DA/EN)

### Sections
1. Hero - Full viewport with interactive background
2. Services - 9 service cards with icons
3. Testimonials - Auto-rotating slider (5s interval)
4. Footer - Contact info and links

### Animations
- Mouse-following hero background (gradient orbs)
- FadeInUp animations
- Smooth scroll
- Mobile menu slide-in
- Dropdown menu fadeIn
