const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('frames')) fs.mkdirSync('frames');

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 360, height: 640 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/save_the_date_v5.html');

  // wait for initial render
  await new Promise(r => setTimeout(r, 2000));

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

  execSync(`ffmpeg -y -framerate 30 -i frames/frame_%04d.png \
    -c:v libx264 -pix_fmt yuv420p -vf scale=1080:1920 output.mp4`);

  console.log("✅ Correct speed video generated: output.mp4");
})();
