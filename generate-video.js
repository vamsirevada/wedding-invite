const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

(async () => {
  if (!fs.existsSync('frames')) fs.mkdirSync('frames');

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 360, height: 640 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/save_the_date_v5.html');

  // Disable infinite looping — force all CSS animations to run only once
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        animation-iteration-count: 1 !important;
      }
    `;
    document.head.appendChild(style);
  });

  // wait for animations to start clean
  await new Promise(r => setTimeout(r, 1000));

  const duration = 28; // seconds
  const fps = 30;
  const totalFrames = duration * fps;

  const start = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    const targetTime = start + (i * 1000 / fps);

    // wait until correct real-world time
    while (Date.now() < targetTime) {}

    await page.screenshot({
      path: `frames/frame_${String(i).padStart(4, '0')}.png`
    });
  }

  await browser.close();

  execSync(`"${ffmpegPath}" -y -framerate 30 -i frames/frame_%04d.png \
    -c:v libx264 -pix_fmt yuv420p -vf scale=1080:1920 output.mp4`);

  console.log("✅ Final video (no loop): output.mp4");
})();
