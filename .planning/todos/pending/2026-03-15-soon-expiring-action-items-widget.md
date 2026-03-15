---
created: 2026-03-15T10:48:40.635Z
title: Soon expiring action items widget
area: ui
files:
  - src/components/ActionItemList.tsx
  - src/pages/WheelPage.tsx
---

## Problem

Users have no visibility into action items with deadlines coming up soon. A deadline could pass unnoticed unless the user manually expands each category.

## Solution

Show a summary widget (e.g. a banner or sidebar section) listing action items whose deadlines fall within the next N days (e.g. 7 days). Could appear on WheelPage above the category list or as a dedicated "Upcoming" section. Decision needed on threshold (3 days? 7 days?) and placement.
