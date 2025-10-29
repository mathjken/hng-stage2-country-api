const db = require('../db'); // Knex connection
const { fetchCountries, fetchExchangeRates } = require('./apiService');
const { generateSummaryImage } = require('./imageService');

// Helper: generate random number between 1000–2000
function getRandomMultiplier() {
    return Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
}

/**
 * Refreshes country data, calculates estimated GDP, and caches it in DB.
 */
async function refreshCountriesData() {
    // 1️⃣ Fetch external data
    const [countryData, exchangeRates] = await Promise.all([
        fetchCountries(),
        fetchExchangeRates()
    ]);
    const refreshTimestamp = new Date();

    const processedCountries = [];

    // 2️⃣ Process each country safely
    for (const country of countryData) {
        if (!country.name || country.population == null) {
            console.warn(`Skipping invalid country: ${country.name}`);
            continue;
        }

        const population = country.population;

        // --- Currency & Exchange Rate ---
        let currency_code = 'N/A';
        let exchange_rate = 0;

        if (country.currencies && country.currencies.length > 0 && country.currencies[0].code) {
            currency_code = country.currencies[0].code.toUpperCase();
            if (exchangeRates[currency_code] != null) {
                exchange_rate = exchangeRates[currency_code];
            }
        }

        // --- Estimated GDP ---
        let estimated_gdp = 0;
        if (population > 0 && exchange_rate > 0) {
            estimated_gdp = (population * getRandomMultiplier()) / exchange_rate;
        }

        // --- Construct final country object ---
        const countryRecord = {
            name: country.name,
            capital: country.capital || null,
            region: country.region || null,
            population: population,
            currency_code: currency_code,
            exchange_rate: exchange_rate,
            estimated_gdp: estimated_gdp,
            flag_url: country.flag || null,
            last_refreshed_at: refreshTimestamp,
        };

        processedCountries.push(countryRecord);
    }

    // 3️⃣ Database UPSERT
    let finalCountryCount = 0;
    let topFiveCountries = [];

    await db.transaction(async (trx) => {
        const countryNames = processedCountries.map(c => c.name);
        const existingCountries = await trx('countries')
            .whereIn('name', countryNames)
            .select('name');
        const existingNames = new Set(existingCountries.map(c => c.name.toLowerCase()));

        const recordsToInsert = [];
        const updatePromises = [];

        for (const record of processedCountries) {
            if (existingNames.has(record.name.toLowerCase())) {
                updatePromises.push(
                    trx('countries')
                        .whereRaw('LOWER(name) = ?', [record.name.toLowerCase()])
                        .update(record)
                );
            } else {
                recordsToInsert.push(record);
            }
        }

        if (recordsToInsert.length > 0) {
            await trx('countries').insert(recordsToInsert);
        }
        await Promise.all(updatePromises);

        // 4️⃣ Update status table & fetch top 5 by GDP
        const totalCountries = await trx('countries').count('id as total').first();
        finalCountryCount = totalCountries ? totalCountries.total : 0;

        topFiveCountries = await trx('countries')
            .select('name', 'estimated_gdp')
            .orderBy('estimated_gdp', 'desc')
            .limit(5);

        await trx('status')
            .where('id', 1)
            .update({
                total_countries: finalCountryCount,
                last_refreshed_at: refreshTimestamp,
            });
    });

    // 5️⃣ Generate summary image
    await generateSummaryImage(finalCountryCount, refreshTimestamp, topFiveCountries);

    return { totalRecords: finalCountryCount, timestamp: refreshTimestamp };
}

module.exports = {
    refreshCountriesData,
    getRandomMultiplier
};
