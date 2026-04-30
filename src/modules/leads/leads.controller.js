import {
  createLead,
  getAllLeads,
  getLeadById,
  softDeleteLead,
  updateLeadStatus,
} from "./leads.service.js";

export const getLeadsController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const results = await getAllLeads({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      ...results,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch leads",
    });
  }
};

export const getLeadByIdController = async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch lead",
    });
  }
};

export const createLeadController = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      message: req.body.message,
      sourcePage: req.body.sourcePage ?? req.body.source_page,
      inquiryType: req.body.inquiryType ?? req.body.inquiry_type,
      status: req.body.status,
      productId: req.body.productId,
    };

    const created = await createLead(payload);

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: created,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create lead",
    });
  }
};

export const updateLeadStatusController = async (req, res) => {
  try {
    const updated = await updateLeadStatus(req.params.id, req.body.status);

    res.status(200).json({
      success: true,
      message: "Lead status updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update lead status",
    });
  }
};

export const deleteLeadController = async (req, res) => {
  try {
    await softDeleteLead(req.params.id);

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete lead",
    });
  }
};
