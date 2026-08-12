#!/bin/zsh
set -euo pipefail

mkdir -p output/pdf output/booth/hybrid tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages tmp/iclo-snowflake-hybrid-logo-fix-v4/video-check tmp/iclo-snowflake-hybrid-logo-fix-v4/pdf-render-check

cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-01.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-01.png
cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-02.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-02.png
cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-03.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-03.png
cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-04.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-04.png
cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-05.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-05.png
cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-06.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-06.png
cp tmp/iclo-snowflake-hybrid-logo-fix-v4/final-render-2560x1440/slide-07.png tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-07.png

sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-01.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-01.pdf
sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-02.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-02.pdf
sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-03.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-03.pdf
sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-04.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-04.pdf
sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-05.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-05.pdf
sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-06.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-06.pdf
sips -s dpiWidth 192 -s dpiHeight 192 -s format pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-07.png --out tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-07.pdf

pdfunite \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-01.pdf \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-02.pdf \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-03.pdf \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-04.pdf \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-05.pdf \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-06.pdf \
  tmp/iclo-snowflake-hybrid-logo-fix-v4/locked-pdf-pages/slide-07.pdf \
  output/pdf/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v4.pdf

ffmpeg -y -f concat -safe 0 \
  -i tmp/iclo-snowflake-hybrid-logo-fix-v4/video-concat-v4.txt \
  -t 56 \
  -vf "scale=1920:1080:flags=lanczos,format=yuv420p" \
  -r 30 -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 18 \
  -movflags +faststart -an \
  output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Booth-Loop-Bilingual-v4.mp4

ffmpeg -y -ss 00:00:01 -i output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Booth-Loop-Bilingual-v4.mp4 -frames:v 1 -update 1 tmp/iclo-snowflake-hybrid-logo-fix-v4/video-check/frame-start.png
ffmpeg -y -ss 00:00:29 -i output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Booth-Loop-Bilingual-v4.mp4 -frames:v 1 -update 1 tmp/iclo-snowflake-hybrid-logo-fix-v4/video-check/frame-middle.png
ffmpeg -y -ss 00:00:55 -i output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Booth-Loop-Bilingual-v4.mp4 -frames:v 1 -update 1 tmp/iclo-snowflake-hybrid-logo-fix-v4/video-check/frame-end.png

pdftoppm -png -r 96 output/pdf/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v4.pdf tmp/iclo-snowflake-hybrid-logo-fix-v4/pdf-render-check/page
