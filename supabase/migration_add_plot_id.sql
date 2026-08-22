-- Migration: adds the plot_id column used by the "spin for a plot" feature.
-- Run this once in the Supabase SQL editor if your project was set up
-- before this feature was added (i.e. schema.sql was already run once).
-- Safe to run even if the column already exists.

alter table rooms add column if not exists plot_id text;
