// @ts-check

const puppeteer = require('puppeteer-core');
const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);

async function getChromePath() {
    let path;

    try {
        path = await linuxAppPath('google-chrome');
    } catch (ball) {
        path = await linuxAppPath('chromium');
    }
    return path;
}

function linuxAppPath(app) {
    return new Promise((resolve, reject) => {
        exec(`which ${app}`, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.trim());
            }
        });
    });
}

/**
 * @param {puppeteer.Browser} browser
 */
async function openChromePopupPage(browser) {
    const backgroundTarget = browser.targets().find((t) => 'background_page' === t.type());
    const backgroundPage = await backgroundTarget.page();

    const popupURL = backgroundPage.url().replace('/_generated_background_page.html', '/edit.html');
    const extensionPopup = await browser.newPage();
    await extensionPopup.goto(popupURL);

    return extensionPopup;
}

const chromeExtensionDebugDir = path.join(__dirname, '../stylus/');
// check if folder exist.
if (!fs.existsSync(chromeExtensionDebugDir)) {
    // if not, error.
    console.error(`chrome extension debug dir not found: ${chromeExtensionDebugDir}`);
    process.exit(1);
}
const cssStyle = fs.readFileSync(path.join(__dirname, args[0]), 'utf8');

(async () => {
    const executablePath = await getChromePath();
    const now = performance.now()

    const browser = await puppeteer.launch({
        executablePath,
        headless: false,
        
        // slowMo: 250,
        args: [
            `--disable-extensions-except=${chromeExtensionDebugDir}`,
            `--load-extension=${chromeExtensionDebugDir}`,
            '--show-component-extension-options',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu',
            `--enable-features=enable-quic,enable-zero-copy`,
        ],
    });
    const stylusExt = await openChromePopupPage(browser);
    stylusExt.evaluate(async (style) => {
        editor.getEditors()[0].setValue(style);
        const nameField = document.querySelector('#basic-info #name');
        nameField.value = 'preview-style';
        editor.updateName(true);

        // save
        await editor.save();
    }, cssStyle);

    const page = await browser.newPage();
    await page.goto(args[1]);

    await page.screenshot({path: 'output.png'});

    console.log(`Took screenshot in ${performance.now() - now}ms`);

    await browser.close();
})();
