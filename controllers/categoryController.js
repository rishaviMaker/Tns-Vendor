const { ProductCategory } = require('../models/ProductCategory');
const { Op } = require('sequelize');

/**
 * Get all categories (top-level only with subcategories)
 * @route GET /api/categories
 * @access Public
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    // Get all top-level categories (parent_id is 0 or null)
    const categories = await ProductCategory.findAll({
      where: {
        parent_id: {
          [Op.or]: [0, null]
        },
        status: 'published'
      },
      include: [{
        model: ProductCategory,
        as: 'subcategories',
        where: { status: 'published' },
        required: false
      }],
      order: [['order', 'ASC']]
    });
    
    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID with subcategories
 * @route GET /api/categories/:id
 * @access Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await ProductCategory.findByPk(id, {
      include: [{
        model: ProductCategory,
        as: 'subcategories',
        where: { status: 'published' },
        required: false
      }]
    });
    
    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategories by parent category ID
 * @route GET /api/categories/:id/subcategories
 * @access Public
 */
exports.getSubcategories = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First check if the parent category exists
    const parentCategory = await ProductCategory.findByPk(id);
    
    if (!parentCategory) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parent category not found'
      });
    }
    
    // Get all subcategories for this parent
    const subcategories = await ProductCategory.findAll({
      where: {
        parent_id: id,
        status: 'published'
      },
      order: [['order', 'ASC']]
    });
    
    res.status(200).json({
      status: 'success',
      results: subcategories.length,
      data: {
        parent: parentCategory,
        subcategories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a hierarchical tree of all categories and subcategories
 * @route GET /api/categories/tree
 * @access Public
 */
exports.getCategoryTree = async (req, res, next) => {
  try {
    // Get all categories
    const allCategories = await ProductCategory.findAll({
      where: { status: 'published' },
      order: [['order', 'ASC']]
    });
    
    // Function to build tree structure
    const buildCategoryTree = (categories, parentId = 0) => {
      const result = [];
      
      categories
        .filter(category => category.parent_id === parentId)
        .forEach(category => {
          // Create a category object without circular references
          const categoryObj = category.toJSON();
          
          // Add children recursively
          const children = buildCategoryTree(categories, category.id);
          if (children.length > 0) {
            categoryObj.children = children;
          }
          
          result.push(categoryObj);
        });
      
      return result;
    };
    
    // Build the tree structure
    const categoryTree = buildCategoryTree(allCategories);
    
    res.status(200).json({
      status: 'success',
      data: {
        categories: categoryTree
      }
    });
  } catch (error) {
    next(error);
  }
};
