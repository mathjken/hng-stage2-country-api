const express = require('express');
const router = express.Router();
const db = require('../db'); // Knex connection
const { refreshCountriesData } = require('../services/dataProcessor');
const { IMAGE_PATH } = require('../services/imageService');
const fs = require('fs/promises');
const path = require('path');

// --- HELPER FUNCTIONS ---

/**
 * Normalizes query parameter names for comparison.
 */
function normalizeParam(param) {
    if (!param) return null;
    return param.trim().toLowerCase();
}

// --- CORE ENDPOINTS ---

// 1. POST /countries/refresh - Triggers data fetching, processing, and caching.
router.post('/refresh', async (req, res) => {
    try {
        const result = await refreshCountriesData();
        
        res.status(200).json({
            message: 'Country data successfully refreshed and cached. Summary image generated.',
            total_countries: result.totalRecords,
            last_refreshed_at: result.timestamp.toISOString(),
        });
    } catch (error) {
        // External API Error Handling (Rule: 503 Service Unavailable)
        if (error.isExternalError) {
            console.error(`External Error: ${error.message}`);
            return res.status(503).json({
                error: "External data source unavailable",
                details: error.message,
            });
        }
        
        // General Internal Server Error
        console.error('Internal Server Error during refresh:', error);
        res.status(500).json({ 
            error: "Internal server error",
            details: error.message,
        });
    }
});

// 2. GET /countries/image - Serves the cached summary image.
router.get('/image', async (req, res) => {
    try {
        // Check if the image file exists
        await fs.access(IMAGE_PATH); 
        
        // Serve the image file
        res.sendFile(path.resolve(IMAGE_PATH));

    } catch (error) {
        // If the file does not exist (ENOENT)
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                error: 'Image not found. Run POST /countries/refresh first to generate the summary image.',
            });
        }
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Internal server error while retrieving image.' });
    }
});

// 3. GET /status - Returns current cache status.
router.get('/status', async (req, res) => {
    try {
        const status = await db('status').where({ id: 1 }).first();

        if (!status) {
            // This should only happen if the migrations failed.
            return res.status(500).json({ error: 'Database status record not found.' });
        }

        res.status(200).json({
            total_countries: status.total_countries,
            last_refreshed_at: status.last_refreshed_at ? status.last_refreshed_at.toISOString() : null,
            cache_status: status.total_countries > 0 ? 'READY' : 'EMPTY',
        });
    } catch (error) {
        console.error('Error fetching status:', error);
        res.status(500).json({ error: 'Internal server error while fetching status.' });
    }
});

// 4. GET /countries - Handles listing, filtering, pagination, and sorting.
router.get('/', async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Filtering
        const region = normalizeParam(req.query.region);
        const currency = normalizeParam(req.query.currency);
        
        // Sorting
        const sortBy = normalizeParam(req.query.sortBy) || 'name';
        const sortOrder = normalizeParam(req.query.sortOrder) === 'desc' ? 'desc' : 'asc';
        
        const validSortColumns = ['name', 'region', 'population', 'estimated_gdp'];
        const orderByColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';

        // Base Query
        let query = db('countries');

        // Apply Filters
        if (region) {
            query = query.whereRaw('LOWER(region) = ?', [region]);
        }
        if (currency) {
            query = query.whereRaw('LOWER(currency_code) = ?', [currency]);
        }

        // 1. Get total count for pagination metadata
        const totalResult = await query.clone().count('id as total').first();
        const totalCount = parseInt(totalResult.total);

        // 2. Get the paginated data
        const data = await query
            .select('name', 'capital', 'region', 'population', 'currency_code', 'exchange_rate', 'estimated_gdp', 'flag_url')
            .orderBy(orderByColumn, sortOrder)
            .limit(limit)
            .offset(offset);

        res.status(200).json({
            meta: {
                total: totalCount,
                page: page,
                limit: limit,
                pages: Math.ceil(totalCount / limit),
                sort: `${orderByColumn}:${sortOrder}`,
            },
            data: data,
        });

    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ error: 'Internal server error while fetching countries.' });
    }
});

// 5. GET /countries/:country - Single country lookup by name.
router.get('/:country', async (req, res) => {
    const countryName = normalizeParam(req.params.country);

    if (!countryName) {
        return res.status(400).json({ error: 'Country name parameter is required.' });
    }

    try {
        const country = await db('countries')
            .whereRaw('LOWER(name) = ?', [countryName]) // Case-insensitive lookup by name
            .orWhereRaw('LOWER(capital) = ?', [countryName]) // Search by capital
            .select('*')
            .first();

        if (!country) {
            return res.status(404).json({ error: 'Country not found' });
        }

        // Exclude internal fields before sending
        delete country.id; 
        delete country.last_refreshed_at;

        res.status(200).json(country);

    } catch (error) {
        console.error('Error fetching single country:', error);
        res.status(500).json({ error: 'Internal server error while fetching country details.' });
    }
});

// 6. DELETE /countries/:name - Delete a country record by name.
router.delete('/:name', async (req, res) => {
    const countryName = normalizeParam(req.params.name);

    if (!countryName) {
        return res.status(400).json({ error: 'Validation failed', details: { name: 'is required' } });
    }

    let deletedCount = 0;

    try {
        await db.transaction(async (trx) => {
            // Delete the country record (case-insensitive match)
            deletedCount = await trx('countries')
                .whereRaw('LOWER(name) = ?', [countryName])
                .del();
            
            if (deletedCount === 0) {
                // Country not found to delete
                return;
            }

            // Update status table count immediately
            const totalResult = await trx('countries').count('id as total').first();
            const newTotal = parseInt(totalResult.total);

            await trx('status')
                .where('id', 1)
                .update({
                    total_countries: newTotal,
                });
        });

        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }

        res.status(200).json({ message: `Country '${req.params.name}' successfully deleted.`, deleted_count: deletedCount });

    } catch (error) {
        console.error('Error deleting country:', error);
        res.status(500).json({ error: 'Internal server error while deleting country.' });
    }
});


module.exports = router;