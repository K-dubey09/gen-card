# Image Generation Guide

This document describes the structured visual brief produced for mind-map style images and how the SVG fallback maps fields to visual elements.

Visual brief JSON (from Ollama)
- `title` — short readable title
- `category` — short category label
- `tagline` — catchy one-line phrase (rendered near top)
- `subtitle` — explanatory subtitle under title
- `visualMetaphor` — short theme note (rendered as small text)
- `callout` — short highlight sentence (rendered at bottom)
- `central` — central node text (rendered in the big center circle)
- `branches` — array of up to 4 branches; each branch is an object:
  - `label` — branch label (rendered in branch circle)
  - `nodes` — array of short child captions (rendered below branch circle as connectors + small text)

SVG fallback mapping
- Background gradient and framed card area
- Top header shows `EXPLANATORY LEARNING MIND MAP` and `category`
- Center circle contains `title`/`central` and `subtitle`
- Branch circles placed around center use `branches[].label`
- Branch child captions use `branches[].nodes` and are connected via dashed lines
- `tagline`, `callout`, `visualMetaphor`, and `summary` are placed in header/footer regions

Frontend integration tips
- The frontend should accept `imageUrl` (primary) and `fallbackImageUrl`. If the primary is a remote image URL, display it; if it's an SVG data URI, ensure the viewer handles `data:` URIs.
- For accessibility, include the card `summary` and `callout` alongside the image as text.
