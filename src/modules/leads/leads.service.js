import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";
import { sendLeadNotification } from "../../utils/email.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const VALID_LEAD_STATUS = new Set(["new", "contacted", "qualified", "closed"]);
const VALID_INQUIRY_TYPES = new Set([
  "general",
  "product",
  "support",
  "partnership",
  "General_Inquiry",
  "Request_for_Quote",
  "Technical_Support",
  "Product_Information",
  "Other",
  "product_inquiry",
]);

const validateProduct = async (productId) => {
  if (productId === undefined || productId === null || productId === "") {
    return null;
  }

  const parsedProductId = Number(productId);
  if (!parsedProductId) throwError("Product ID is invalid", 400);

  const product = await prisma.product.findUnique({
    where: { id: parsedProductId },
  });

  if (!product || product.isDeleted) {
    throwError("Product not found", 404);
  }

  return product;
};

export const getAllLeads = async () => {
  try {
    return await prisma.lead.findMany({
      where: { isDeleted: false },
      include: {
        Product: {
          include: {
            Category: true,
            SubCategory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throwError("Failed to fetch leads", 500);
  }
};

export const getLeadById = async (id) => {
  if (!id) throwError("Lead ID is required", 400);

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
      include: {
        Product: {
          include: {
            Category: true,
            SubCategory: true,
          },
        },
      },
    });

    if (!lead) throwError("Lead not found", 404);

    return lead;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch lead", 500);
  }
};

export const createLead = async (data) => {
  const name = normalizeString(data?.name);
  const email = normalizeString(data?.email);
  const inquiryType = data?.inquiryType || "general";
  const status = data?.status || "new";

  if (!name) throwError("Name is required", 400);
  if (!email) throwError("Email is required", 400);
  if (!VALID_INQUIRY_TYPES.has(inquiryType)) {
    throwError("Invalid inquiry type", 400);
  }
  if (!VALID_LEAD_STATUS.has(status)) {
    throwError("Invalid lead status", 400);
  }

  try {
    const product = await validateProduct(data?.productId);

    const createdLead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: normalizeString(data?.phone) || null,
        company: normalizeString(data?.company) || null,
        message: data?.message || null,
        sourcePage: data?.sourcePage || null,
        inquiryType,
        status,
        productId: product ? product.id : null,
      },
      include: {
        Product: {
          include: {
            Category: true,
            SubCategory: true,
          },
        },
      },
    });

    await sendLeadNotification(
      {
        name: createdLead.name,
        email: createdLead.email,
        phone: createdLead.phone,
        company: createdLead.company,
        message: createdLead.message,
        inquiry_type: createdLead.inquiryType,
        source_page: createdLead.sourcePage,
      },
      product ? product.name : null,
    );

    return createdLead;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to create lead", 500);
  }
};

export const updateLeadStatus = async (id, status) => {
  if (!id) throwError("Lead ID is required", 400);
  if (!status) throwError("Status is required", 400);

  if (!VALID_LEAD_STATUS.has(status)) {
    throwError("Invalid lead status", 400);
  }

  try {
    const existing = await prisma.lead.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Lead not found", 404);
    }

    return await prisma.lead.update({
      where: { id: Number(id) },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        Product: {
          include: {
            Category: true,
            SubCategory: true,
          },
        },
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update lead status", 500);
  }
};

export const softDeleteLead = async (id) => {
  if (!id) throwError("Lead ID is required", 400);

  try {
    const existing = await prisma.lead.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Lead not found", 404);
    }

    await prisma.lead.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to delete lead", 500);
  }
};
