-- Migration: Create junction tables for ProductRequest categories, collections and labels
-- Created: 2025-11-14

-- Table for ProductRequest to ProductCategory relationship
CREATE TABLE IF NOT EXISTS product_request_category_product (
  category_id INT,
  product_request_id INT,
  INDEX idx_pr_category_request_id (product_request_id),
  INDEX idx_pr_category_id (category_id)
);

-- Table for ProductRequest to ProductCollection relationship
CREATE TABLE IF NOT EXISTS product_request_collection_products (
  product_collection_id INT,
  product_request_id INT,
  INDEX idx_product_request_id (product_request_id),
  INDEX idx_product_collection_id (product_collection_id)
);

-- Table for ProductRequest to ProductLabel relationship
CREATE TABLE IF NOT EXISTS product_request_label_products (
  product_request_id INT NOT NULL,
  product_label_id INT NOT NULL,
  PRIMARY KEY (product_request_id, product_label_id),
  INDEX idx_product_request_id (product_request_id),
  INDEX idx_product_label_id (product_label_id)
);
