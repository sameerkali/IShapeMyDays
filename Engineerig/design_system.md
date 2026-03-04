# design_system.md
# IShapeMyDays – Design System & UI Consistency Guide

---

# 1. Design Philosophy

IShapeMyDays is:

- Focused
- Minimal
- Structured
- Premium
- Calm but performance-oriented

This is NOT:
- Playful
- Cartoonish
- Over-animated
- Color-heavy

Design Principles:

1. Clarity over decoration
2. Speed over complexity
3. Data readability first
4. Mobile-first layout
5. One primary action per screen

---

# 2. Design Tone

Emotional Feel:
- Calm control
- Personal mastery
- Structured life system
- Clean intelligence

Visual Direction:
- Dark-first design (primary theme)
- High contrast typography
- Strong accent color
- Generous spacing

---

# 3. Color System

Primary Theme: Dark Premium

## Background Colors

Primary Background:
#0F172A  (Deep Slate Navy)

Secondary Background:
#1E293B  (Card surfaces)

Tertiary Surface:
#334155  (Elevated elements)

Divider:
#475569

---

## Primary Accent Color (Energy)

Emerald Blue:
#10B981

Hover/Active:
#059669

Reason:
- Represents growth
- Feels productive
- Calm but energetic
- Excellent contrast on dark background

---

## Secondary Accent (Data / AI / Insights)

Electric Indigo:
#6366F1

Used for:
- Charts
- AI insights
- Analytics highlights

---

## Status Colors

Success:
#22C55E

Warning:
#F59E0B

Error:
#EF4444

Neutral:
#94A3B8

---

# 4. Typography

Font Recommendation:

Primary Font:
Inter

Backup:
System UI stack

---

## Typography Scale (Mobile First)

H1:
24px
font-weight: 700

H2:
20px
font-weight: 600

H3:
18px
font-weight: 600

Body Large:
16px
font-weight: 500

Body Regular:
14px
font-weight: 400

Caption:
12px
color: #94A3B8

---

# 5. Spacing System (8pt Grid)

Use consistent spacing multiples:

4px
8px
16px
24px
32px

Mobile padding:
Horizontal: 16px
Section spacing: 24px

Never random spacing.

---

# 6. Layout System (Mobile First)

Base Width:
100%

Max Content Width (Desktop):
640px centered

Structure per screen:

- Top Navigation (sticky)
- Scrollable content area
- Bottom fixed action button (when required)

---

# 7. Core UI Components

---

## 7.1 Buttons

Primary Button:
- Background: #10B981
- Text: White
- Border-radius: 12px
- Height: 48px
- Full width on mobile

Secondary Button:
- Transparent
- Border: 1px solid #334155
- Text: White

Danger Button:
- Background: #EF4444

---

## 7.2 Cards

Card:
- Background: #1E293B
- Border-radius: 16px
- Padding: 16px
- Subtle shadow
- Border: 1px solid #334155

---

## 7.3 Inputs

Input Fields:
- Background: #0F172A
- Border: 1px solid #334155
- Border-radius: 12px
- Height: 44px
- Focus border: #10B981

Labels:
- 12px uppercase subtle
- Color: #94A3B8

---

## 7.4 Habit Completion Dots

Completed:
Filled circle #10B981

Incomplete:
Outlined circle #475569

---

## 7.5 Progress Ring (Calories)

Base:
Dark track #334155

Progress:
#10B981

Text inside:
Large bold number

---

# 8. Navigation Pattern

Mobile Navigation:

Bottom Tab Bar (4 tabs):

1. Dashboard
2. Log
3. Analytics
4. Profile

Active tab:
Emerald highlight

Inactive:
Muted gray

Icons:
Minimal line icons 

---

# 9. Charts & Data Visualization

Library:
Recharts

Guidelines:

- Dark grid lines
- High contrast data lines
- Avoid more than 4 colors per chart
- Consistent color mapping per category

Category Colors:
User-defined but validated for contrast

---

# 10. Animations

Use subtle micro-animations:

- Button press scale: 0.97
- Card fade-in
- Smooth habit toggle transition

Avoid:
- Heavy motion
- Bouncy transitions
- Attention-seeking animations

---

# 11. Accessibility

Minimum contrast ratio:
4.5:1

Tap target minimum:
44px height

Font minimum:
14px body

Avoid:
- Low contrast gray text
- Tiny interactive elements

---

# 12. UX Rules

Daily logging under 2 minutes.

Rules:

- One dominant CTA per screen
- Avoid multi-step flows
- Use bottom sheets for quick edits
- Pre-fill frequent foods
- Remember last selected meal type

---

# 13. Profile Screen Design

Display:

- Circular avatar
- Name (bold)
- Profession (muted)
- Goal highlighted in accent box
- Weekly score summary

---

# 14. AI Insight Styling (Future)

AI Card:

- Indigo border accent
- Subtle gradient background
- Icon: brain or spark
- Structured bullet insights

Must look intelligent, not gimmicky.

---

# 15. Dark Mode Only (For MVP)

Avoid light mode initially.
Focus on perfecting one theme.

---

# 16. Brand Identity Summary

Brand Name:
IShapeMyDays

Tone:
Intentional self-mastery

Visual Identity:
Dark structured interface
Emerald energy accents
High-clarity typography
Minimal distractions




# 17. Icon System

## Icon Library

Only use:

Phosphor Icons

No mixing with:
- Lucide
- Heroicons
- Material Icons
- Custom random SVGs

Consistency is mandatory.

---

## Style Rules

Use:
- Phosphor "Regular" weight for default
- "Bold" weight only for active state or emphasis
- No thin/light weight
- No filled icons unless explicitly needed for state feedback

Icon Size Standards:

Tab Bar Icons:
24px

Inline Icons:
20px

Small UI Indicators:
16px

Large Feature Icons:
28px

---

## Color Usage

Default Icon Color:
#94A3B8 (Muted Gray)

Active State:
#10B981 (Primary Emerald)

Danger Action:
#EF4444

Disabled:
#475569

Never use random category colors for icons in navigation.
Icons should not compete with data visuals.

---

## Usage Guidelines

1. Every tab must have icon + label.
2. Icons should reinforce meaning, not decorate.
3. No animated icons.
4. Avoid mixing outlined and filled styles randomly.
5. Keep spacing consistent (8px between icon and text).

---

## Recommended Core Icons (Phosphor)

Dashboard:
House

Log:
CheckCircle or ClipboardText

Analytics:
ChartLineUp

Profile:
UserCircle

Add Action:
PlusCircle

Delete:
Trash

Edit:
PencilSimple

Settings:
Gear

Streak:
Fire

Calories:
Flame or ForkKnife

AI Insights (Future):
Brain

---

## UX Rule

Icons support recognition.
Text ensures clarity.

Never rely on icon-only navigation.