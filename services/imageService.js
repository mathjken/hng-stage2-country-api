const { createCanvas } = require('canvas');
const fs = require('fs/promises');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const IMAGE_PATH = path.join(CACHE_DIR, 'summary.png');

// Constants for image dimensions
const WIDTH = 600;
const HEIGHT = 400;

/**
 * Generates and saves a summary image file (summary.png).
 * @param {number} totalCountries 
 * @param {Date} lastRefreshedAt 
 * @param {Array<Object>} topFiveCountries - List of top 5 countries with name and estimated_gdp
 * @returns {Promise<string>} Path to the generated image file.
 */
async function generateSummaryImage(totalCountries, lastRefreshedAt, topFiveCountries = []) {
    console.log('[Image Service] Starting image generation...');

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Header Text
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#0055AA';
    ctx.textAlign = 'center';
    ctx.fillText('Country API Data Summary', WIDTH / 2, 40);

    // 3. Status Content
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';

    ctx.fillText(`Total Countries Cached: ${totalCountries}`, 50, 90);

    const formattedDate = lastRefreshedAt.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'UTC'
    }) + ' UTC';
    ctx.fillText(`Last Refreshed: ${formattedDate}`, 50, 120);

    // 4. Top 5 GDP List
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('Top 5 Countries by Estimated GDP:', 50, 180);

    let yOffset = 210;
    ctx.font = '16px Arial';

    if (topFiveCountries.length === 0) {
         ctx.fillText('No data available.', 50, yOffset);
    } else {
        topFiveCountries.forEach((country, index) => {
            const rank = index + 1;
            const gdp = parseFloat(country.estimated_gdp).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            
            const text = `${rank}. ${country.name} (${gdp})`;
            ctx.fillText(text, 60, yOffset);
            yOffset += 25;
        });
    }
    
    // 5. Footer
    ctx.font = '14px Arial';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.fillText('Data powered by restcountries.com and open.er-api.com', WIDTH / 2, HEIGHT - 20);

    // 6. Ensure cache directory exists and save the image
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(IMAGE_PATH, buffer);

    console.log(`[Image Service] Summary image saved to: ${IMAGE_PATH}`);
    return IMAGE_PATH;
}

module.exports = {
    generateSummaryImage,
    IMAGE_PATH,
};