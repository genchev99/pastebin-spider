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

/* Modules */
const middlware = require("./modules/puppeteer_middleware");

/* Models */
const paste = require("./models/paste");

mongoose.connect(process.env.DATABASE_URL, connectionOpts).then(async () => {
  console.log(`Database connected on ${process.env.DATABASE_URL}`);

  const browser = await createBrowser();

  const links = await getPasteLinks(browser);
  console.log(links);
  
  await browser.close();

}).catch(err => {
  console.error(err, "Database connection error");

  process.exit(1065);
});

/**
 * Creates new puppeteer browser instance
 * @returns {Promise<any>}
 */
const createBrowser = () => new Promise(async (resolve, reject) => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true
  }).catch(err => {
    return reject(err);
  });

  return resolve(browser);
});

/**
 * Scrapes the paste links on the archive page
 * @param browser
 * @returns {Promise<any>}
 */
const getPasteLinks = browser => new Promise(async (resolve, reject) => {
  try {
    /* Creating new page */
    let page = await browser.newPage();

    page = await middlware.pageGoto(page, "https://pastebin.com/archive");

    /* Getting all fresh links */
    const links = await page.evaluate(() => {
      const rows = document.querySelectorAll("td:not(.td_smaller) a");
      let links = [];

      for (const row of rows) {
        links.push(row.href);
      }

      return links;
    });

    return resolve(links);
  } catch (e) {
    return reject(e);
  }
});

