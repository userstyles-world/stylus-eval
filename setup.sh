#!/usr/bin/env bash

cd `dirname "$0"`

xvfb-run -s "-screen 0 1280x1024x16" -a node ./index.js $@
