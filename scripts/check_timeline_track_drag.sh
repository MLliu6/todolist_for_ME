#!/usr/bin/env bash
set -euo pipefail

echo "== check: timeline week window base exists =="
grep -q 'tdm_timeline_center_date' index.html
grep -q 'timeline-week-lane' index.html
grep -q 'data-tl-shift' index.html
grep -q 'data-tl-today' index.html

echo "== check: track drag code exists =="
grep -q 'tdm_timeline_track_order' index.html
grep -q 'moveTrack(source,target)' index.html
grep -q 'data-timeline-track' index.html
grep -q 'timeline-label-grip' index.html
grep -q 'draggingTrack' index.html

echo "== check: track drag css exists =="
grep -q 'BEGIN timeline track order drag' quadrant-theme.css
grep -q 'timeline-label-grip' quadrant-theme.css
grep -q 'timeline-track.drag-over' quadrant-theme.css

echo "== check: no broken external enhancers =="
! grep -q 'timeline-enhance\|__timelineEnhanced\|theme-palette' index.html quadrant-theme.css

echo "== check: passed =="
