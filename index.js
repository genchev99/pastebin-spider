'use strict';

const root = require('app-root-path');
require('dotenv').config({path: `${root.path}/.env`}); /* Loading env variables */

/*Dependencies*/
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const recaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

puppeteer.use(pluginStealth());
puppeteer.use(
    recaptchaPlugin({
      provider: { id: '2captcha', token: process.env.CAPTCHA_TOKEN },
      visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    })
);

const mongoose = require("mongoose");
const connectionOpts = {useNewUrlParser: true};

mongoose.connect(process.env.DATABASE_URL, connectionOpts).then(() => {
  console.log(`Database connected on ${process.env.DATABASE_URL}`);


}).catch(err => {
  console.error(err, "Database connection error");

  process.exit(1065);
});

