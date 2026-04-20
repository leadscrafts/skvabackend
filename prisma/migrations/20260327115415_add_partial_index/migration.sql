-- This is an empty migration.
-- Category
CREATE UNIQUE INDEX "category_slug_unique_active"
ON "Category"(slug)
WHERE "isDeleted" = false;

-- SubCategory
CREATE UNIQUE INDEX "subcategory_slug_unique_active"
ON "SubCategory"(slug)
WHERE "isDeleted" = false;

-- Product
CREATE UNIQUE INDEX "product_slug_unique_active"
ON "Product"(slug)
WHERE "isDeleted" = false;

-- BlogPost (optional)
CREATE UNIQUE INDEX "blogpost_slug_unique_active"
ON "BlogPost"(slug)
WHERE "isDeleted" = false;