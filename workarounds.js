//@ts-check
const puppeteer = require('puppeteer-core');

/** @type {[RegExp, (page: puppeteer.Page) => Promise<void>][]} */
const workArounds = [
    [/google\..*/, googlePolicy],
    [/youtube\.com/, youtubePolicy],
    [/roblox.com/, robloxRedirect],
    [/twitter\.com/, twitterRedirect],
    [/github\.com/, githubRedirect],
];

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function githubRedirect(page) {
    console.log(`Applying github redirect workaround for ${page.url()}`);
    if (page.url() === 'https://github.com/') {
        await page.goto('https://github.com/userstyles-world/userstyles.world', {waitUntil: 'domcontentloaded'});
    }
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function twitterRedirect(page) {
    console.log(`Applying twitter redirect for ${page.url()}`);
    if (page.url() === 'https://twitter.com/') {
        // Fox is always good!
        await page.goto('https://twitter.com/joinmastodon/', {waitUntil: 'domcontentloaded'});
    }
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function robloxRedirect(page) {
    console.log(`Applying roblox redirect for ${page.url()}`);
    if (page.url() === 'https://www.roblox.com/') {
        await page.goto('https://www.roblox.com/discover#/', {waitUntil: "networkidle0"});
    }
    await page.waitForSelector('.cookie-button-container .btn-cta-lg', {
        timeout: 5000,});
    await page.click('.cookie-button-container .btn-cta-lg');
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function googlePolicy(page) {
    console.log(`Applying google policy workaround on: "${page.url()}"`);
    // Click button img + div + div > :last-child
    await page.click('img + div + div > :last-child');
}

/**
 * @param {puppeteer.Page} page
 * @returns {Promise<void>}
 */
async function youtubePolicy(page) {
    console.log(`Applying youtube workaround on: "${page.url()}"`);
    // Click button .buttons.ytd-consent-bump-v2-lightbox > :last-child [role="button"]
    await page.click('.buttons.ytd-consent-bump-v2-lightbox > :last-child [role="button"]');
    // This is some custom button so it might take a bit of time to dissapear.
    await page.waitForTimeout(500);
}

/**
 * @param {string} url
 * @returns {(page: puppeteer.Page) => Promise<void>}
 */
function matchPage(url) {
    console.log(`Checking "${url}"`);
    for (let i = 0; i < workArounds.length; i++) {
        if (workArounds[i][0].test(url)) {
            return workArounds[i][1];
        }
    }
    return null;
}

const cloudflareTitles = [
    'Please Wait... | Cloudflare',
    'Just a moment...',
];

/**
 * @param {puppeteer.Page} page
 */
async function checkForWorkarounds(page) {
    let domain;
    try {
        const pageURL = new URL(page.url());
        domain = pageURL.hostname;
    } catch (e) {
        console.log(`Error parsing page URL: ${e}`);
        return;
    }
    const workAround = matchPage(domain);
    if (workAround) {
        await workAround(page);
    }
    // Check the title against the common cloudflare title.
    const pageTitle = await page.title();
    console.log(`Checking Title "${pageTitle}"`);

    if (cloudflareTitles.includes(pageTitle)) {
        console.log(`Cloudflare detected on "${domain}"`);
        // Exit the program.
        process.exit(31);
    }
}

module.exports = {
    checkForWorkarounds,
};