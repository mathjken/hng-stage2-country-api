/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('countries', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable().unique();
      table.string('capital', 255).nullable();
      table.string('region', 255).nullable().index(); // for filtering
      table.bigInteger('population').notNullable();
      // NOTE: The task says currency_code is required, though your logic handles NULL. Sticking to notNullable for DB definition.
      table.string('currency_code', 10).notNullable().index(); // for filtering
      table.decimal('exchange_rate', 15, 4).nullable(); // NULL if no rate found
      table.decimal('estimated_gdp', 30, 2).nullable().index(); // for sorting
      table.string('flag_url', 512).nullable();
      
      // FIX: Use knex.raw() for MySQL auto-timestamp update behavior
      table.timestamp('last_refreshed_at')
           .notNullable()
           .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')); 
    })
    .createTable('status', (table) => {
      // Single row table to track refresh status
      table.integer('id').primary().defaultTo(1); 
      table.integer('total_countries').defaultTo(0);
      // NOTE: Using a simple timestamp here is fine, no need for ON UPDATE
      table.timestamp('last_refreshed_at').nullable(); 
    })
    .then(() => {
      // Insert the single required row into the status table
      return knex('status').insert({ id: 1, total_countries: 0, last_refreshed_at: null });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Drop tables in reverse order of creation
  return knex.schema
    .dropTableIfExists('status')
    .dropTableIfExists('countries');
};