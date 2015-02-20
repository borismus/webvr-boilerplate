#!/usr/bin/env sh

# First, make the webm video.
ffmpeg -f image2 -i no-sleep-%01d.png -r 12 -s 16x16 no-sleep.webm
# Next, base64 encode it, and print the result.
openssl base64 -A -in no-sleep.webm
