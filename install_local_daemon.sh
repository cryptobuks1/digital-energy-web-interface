#!/bin/sh

npm install -g pm2
npm ci
pm2 startup
pm2 start ./standalone.js
pm2 save
