#!/usr/bin/env sh
# Make sure an argument is provided.
# Make sure the argument is an existing file.

openssl base64 -A -in $1 | pbcopy
