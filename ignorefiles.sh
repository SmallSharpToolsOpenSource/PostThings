#!/bin/sh

# prevent files with private keys from being committed and pushed

git update-index --assume-unchanged Parse/PostThings/config/global.json

