const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

function createCrudController(service, labels = {}) {
  const entityLabel = labels.entityLabel || 'Record';
  const listLabel = labels.listLabel || `${entityLabel}s`;

  return {
    list: asyncHandler(async (req, res) => {
      const result = await service.list(req.query, req.user);
      res.json({
        success: true,
        message: `${listLabel} fetched successfully`,
        data: result.items || [],
        pagination: {
          total: result.pagination?.total || (result.items || []).length,
          page: result.pagination?.page || 1,
          limit: result.pagination?.limit || (result.items || []).length
        }
      });
    }),
    getById: asyncHandler(async (req, res) => {
      const data = await service.getById(req.params.id, req.user);
      res.json(successResponse(`${entityLabel} fetched successfully`, data));
    }),
    create: asyncHandler(async (req, res) => {
      const data = await service.create(req.body, req.user);
      res.status(201).json(successResponse(`${entityLabel} created successfully`, data));
    }),
    update: asyncHandler(async (req, res) => {
      const data = await service.update(req.params.id, req.body, req.user);
      res.json(successResponse(`${entityLabel} updated successfully`, data));
    }),
    remove: asyncHandler(async (req, res) => {
      const data = await service.remove(req.params.id, req.user);
      res.json(successResponse(`${entityLabel} deleted successfully`, data));
    })
  };
}

module.exports = createCrudController;