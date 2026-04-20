import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const validateCategory = async (categoryId) => {
  if (categoryId === undefined || categoryId === null) return null;

  const parsedCategoryId = Number(categoryId);
  if (!parsedCategoryId) throwError("Category ID is invalid", 400);

  const category = await prisma.category.findUnique({
    where: { id: parsedCategoryId },
  });

  if (!category || category.isDeleted) {
    throwError("Category not found", 404);
  }

  return parsedCategoryId;
};

const validateSubCategory = async (subcategoryId) => {
  if (subcategoryId === undefined || subcategoryId === null) return null;

  const parsedSubCategoryId = Number(subcategoryId);
  if (!parsedSubCategoryId) throwError("SubCategory ID is invalid", 400);

  const subCategory = await prisma.subCategory.findUnique({
    where: { id: parsedSubCategoryId },
  });

  if (!subCategory || subCategory.isDeleted) {
    throwError("SubCategory not found", 404);
  }

  return subCategory;
};

const validateCategorySubCategoryMatch = (categoryId, subCategory) => {
  if (!categoryId || !subCategory) return;

  if (Number(subCategory.categoryId) !== Number(categoryId)) {
    throwError("SubCategory does not belong to the selected category", 400);
  }
};

export const getAllProducts = async () => {
  try {
    return await prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throwError("Failed to fetch products", 500);
  }
};

export const getAllProductsAdmin = async () => {
  try {
    return await prisma.product.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throwError("Failed to fetch products", 500);
  }
};

export const getFilteredProducts = async (filters = {}) => {
  try {
    const { page = 1, limit = 12, search, category, subcategory } = filters;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      isDeleted: false,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { fullDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      const cat = await prisma.category.findFirst({
        where: { slug: category, isDeleted: false },
        select: { id: true },
      });
      if (!cat) throwError("Category not found", 404);
      where.categoryId = cat.id;
    }

    if (subcategory) {
      const sub = await prisma.subCategory.findFirst({
        where: { slug: subcategory, isDeleted: false },
        select: { id: true },
      });
      if (!sub) throwError("SubCategory not found", 404);
      where.subcategoryId = sub.id;
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          Category: true,
          SubCategory: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  } catch (error) {
    throwError("Failed to fetch products", 500);
  }
};

export const getProductById = async (id) => {
  if (!id) throwError("Product ID is required", 400);

  try {
    const product = await prisma.product.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    if (!product) throwError("Product not found", 404);

    return product;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch product", 500);
  }
};

export const getProductBySlug = async (slug) => {
  if (!slug) throwError("Product slug is required", 400);

  try {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isDeleted: false,
        isActive: true,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    if (!product) throwError("Product not found", 404);

    return product;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch product", 500);
  }
};

export const createProduct = async (data) => {
  const name = normalizeString(data?.name);
  const slug = normalizeString(data?.slug);

  if (!name) throwError("Name is required", 400);
  if (!slug) throwError("Slug is required", 400);

  try {
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing && !existing.isDeleted) {
      throwError("Slug already exists", 409);
    }

    const categoryId = await validateCategory(data?.categoryId);
    const subCategory = await validateSubCategory(data?.subcategoryId);
    const subcategoryId = subCategory ? subCategory.id : null;

    validateCategorySubCategoryMatch(categoryId, subCategory);

    return await prisma.product.create({
      data: {
        ...data,
        name,
        slug,
        categoryId,
        subcategoryId,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to create product", 500);
  }
};

export const updateProduct = async (id, data) => {
  if (!id) throwError("Product ID is required", 400);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Product not found", 404);
    }

    const updateData = { ...data };

    if (data.name !== undefined) {
      const name = normalizeString(data.name);
      if (!name) throwError("Name cannot be empty", 400);
      updateData.name = name;
    }

    if (data.slug !== undefined) {
      const slug = normalizeString(data.slug);
      if (!slug) throwError("Slug cannot be empty", 400);
      updateData.slug = slug;

      if (slug !== existing.slug) {
        const slugExists = await prisma.product.findFirst({
          where: {
            slug,
            isDeleted: false,
            NOT: { id: Number(id) },
          },
        });

        if (slugExists) throwError("Slug already exists", 409);
      }
    }

    if (data.categoryId !== undefined || data.subcategoryId !== undefined) {
      const categoryIdInput =
        data.categoryId !== undefined ? data.categoryId : existing.categoryId;
      const parsedCategoryId = await validateCategory(categoryIdInput);

      const subCategoryInput =
        data.subcategoryId !== undefined
          ? data.subcategoryId
          : existing.subcategoryId;

      let subCategory = null;
      let parsedSubCategoryId = null;
      if (subCategoryInput !== null) {
        subCategory = await validateSubCategory(subCategoryInput);
        parsedSubCategoryId = subCategory ? subCategory.id : null;
      }

      validateCategorySubCategoryMatch(parsedCategoryId, subCategory);

      updateData.categoryId = parsedCategoryId;
      updateData.subcategoryId = parsedSubCategoryId;
    }

    updateData.updatedAt = new Date();

    return await prisma.product.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        Category: true,
        SubCategory: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update product", 500);
  }
};

export const softDeleteProduct = async (id) => {
  if (!id) throwError("Product ID is required", 400);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Product not found", 404);
    }

    await prisma.product.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to delete product", 500);
  }
};

export const updateProductActive = async (id, isActive) => {
  if (!id) throwError("Product ID is required", 400);
  if (typeof isActive !== "boolean")
    throwError("isActive must be a boolean", 400);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Product not found", 404);
    }

    return await prisma.product.update({
      where: { id: Number(id) },
      data: {
        isActive,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update product active status", 500);
  }
};

export const updateProductFeatured = async (id, isFeatured) => {
  if (!id) throwError("Product ID is required", 400);
  if (typeof isFeatured !== "boolean") {
    throwError("isFeatured must be a boolean", 400);
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Product not found", 404);
    }

    return await prisma.product.update({
      where: { id: Number(id) },
      data: {
        isFeatured,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update product featured status", 500);
  }
};
