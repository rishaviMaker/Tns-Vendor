const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Slug = sequelize.define('Slug', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'URL slug key'
  },
  reference_type: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Model type (e.g., Botble\\Ecommerce\\Models\\Product)'
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the referenced model'
  },
  prefix: {
    type: DataTypes.STRING(120),
    allowNull: true,
    defaultValue: '',
    comment: 'URL prefix (e.g., products, categories)'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'slugs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['key']
    },
    {
      fields: ['reference_type', 'reference_id']
    }
  ]
});

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-friendly slug
 */
Slug.generateSlug = function(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
};

/**
 * Create a unique slug for a reference
 * @param {string} text - Text to convert to slug
 * @param {string} referenceType - Model type
 * @param {number} referenceId - Model ID
 * @param {string} prefix - URL prefix
 * @returns {Promise<Slug>} - Created slug instance
 */
Slug.createSlug = async function(text, referenceType, referenceId, prefix = 'products') {
  let slug = this.generateSlug(text);
  let uniqueSlug = slug;
  let counter = 1;

  // Check if slug already exists and make it unique
  while (await this.findOne({ where: { key: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return await this.create({
    key: uniqueSlug,
    reference_type: referenceType,
    reference_id: referenceId,
    prefix: prefix
  });
};

/**
 * Update or create a slug for a reference
 * @param {string} text - Text to convert to slug
 * @param {string} referenceType - Model type
 * @param {number} referenceId - Model ID
 * @param {string} prefix - URL prefix
 * @returns {Promise<Slug>} - Updated or created slug instance
 */
Slug.upsertSlug = async function(text, referenceType, referenceId, prefix = 'products') {
  // Check if slug already exists for this reference
  const existingSlug = await this.findOne({
    where: {
      reference_type: referenceType,
      reference_id: referenceId
    }
  });

  if (existingSlug) {
    // Update existing slug
    const newSlugKey = this.generateSlug(text);
    let uniqueSlug = newSlugKey;
    let counter = 1;

    // Make sure the new slug is unique (excluding current record)
    while (true) {
      const duplicate = await this.findOne({
        where: {
          key: uniqueSlug,
          id: { [sequelize.Sequelize.Op.ne]: existingSlug.id }
        }
      });
      if (!duplicate) break;
      uniqueSlug = `${newSlugKey}-${counter}`;
      counter++;
    }

    await existingSlug.update({ key: uniqueSlug, prefix });
    return existingSlug;
  } else {
    // Create new slug
    return await this.createSlug(text, referenceType, referenceId, prefix);
  }
};

module.exports = { Slug };
