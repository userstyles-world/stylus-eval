#!/usr/bin/env bash

xvfb-run -s "-screen 0 1280x1024x16" -a yarn run start $@
