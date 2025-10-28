const db = require('../db'); // Knex connection
const { fetchCountries, fetchExchangeRates } = require('./apiService');
const { generateSummaryImage } = require('./imageService');

// Helper function to generate random number between 1000 and 2000
function getRandomMultiplier() {
    return Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
}

/**
 * Orchestrates the entire data refresh process: fetch, process, and cache.
 */
async function refreshCountriesData() {
    // 1. Fetch data from external APIs
    const [countryData, exchangeRates] = await Promise.all([
        fetchCountries(),
        fetchExchangeRates()
    ]);
    const refreshTimestamp = new Date();

    const processedCountries = [];

    // 2. Process and Calculate Data
    for (const country of countryData) {
        // Validation check for required fields
        if (!country.name || country.population === undefined) {
            console.warn(`Skipping country due to missing Name or Population: ${country.name}`);
            continue;
        }

        let currency_code = null;
        let exchange_rate = null;
        let estimated_gdp = null;
        const population = country.population;

        if (country.currencies && country.currencies.length > 0 && country.currencies[0].code) {
            // Rule: store only the first currency code
            currency_code = country.currencies[0].code.toUpperCase();
            
            // Rule: Check if currency code exists in fetched exchange rates
            if (exchangeRates[currency_code] !== undefined) {
                exchange_rate = exchangeRates[currency_code];
            }
        } 

        // --- GDP Calculation ---
        if (exchange_rate && population && population > 0) {
            const multiplier = getRandomMultiplier();
            // Formula: population × random(1000–2000) ÷ exchange_rate
            estimated_gdp = (population * multiplier) / exchange_rate;
        } else if (currency_code === null) {
            // Rule: If currencies array is empty, set estimated_gdp to 0
            estimated_gdp = 0;
        }
        
        // --- Construct Final Object ---
        const countryRecord = {
            name: country.name,
            capital: country.capital || null,
            region: country.region || null,
            population: population,
            exchange_rate: exchange_rate,
            estimated_gdp: estimated_gdp,
            flag_url: country.flag || null,
            last_refreshed_at: refreshTimestamp,
        };
        
        // To comply with the NOT NULL constraint on currency_code, use 'N/A' if null.
        countryRecord.currency_code = currency_code || 'N/A';

        processedCountries.push(countryRecord);
    }

    // 3. Database UPSERT (Update or Insert) Transaction
    let finalCountryCount = 0;
    let topFiveCountries = [];

    await db.transaction(async (trx) => {
        const countryNames = processedCountries.map(c => c.name);

        // Fetch existing countries to determine insert vs. update
        const existingCountries = await trx('countries')
            .whereIn('name', countryNames)
            .select('name');
        
        const existingNames = new Set(existingCountries.map(c => c.name.toLowerCase()));

        const recordsToInsert = [];
        const updatePromises = [];

        for (const record of processedCountries) {
            if (existingNames.has(record.name.toLowerCase())) {
                // Update Logic (case-insensitive name match)
                updatePromises.push(
                    trx('countries')
                        .whereRaw('LOWER(name) = ?', [record.name.toLowerCase()])
                        .update(record)
                );
            } else {
                // Insert Logic
                recordsToInsert.push(record);
            }
        }
        
        // Execute inserts and updates
        if (recordsToInsert.length > 0) {
            await trx('countries').insert(recordsToInsert);
        }
        await Promise.all(updatePromises);

        // 4. Update Status Table and Fetch Top 5
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

    // 5. Generate Summary Image
    await generateSummaryImage(finalCountryCount, refreshTimestamp, topFiveCountries);
    
    return { totalRecords: finalCountryCount, timestamp: refreshTimestamp };
}

module.exports = {
    refreshCountriesData,
    getRandomMultiplier 
};