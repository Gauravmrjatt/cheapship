const express = require('express');
const router = express.Router();
const vyom = require('../utils/vyom');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

const handleVyomResponse = (res, result, successStatus = 200) => {
  if (!result) {
    return res.status(503).json({ message: 'Vyom service not configured or unavailable' });
  }
  if (result.error) {
    return res.status(result.status || 500).json({ message: result.message || 'Vyom API error' });
  }
  return res.status(successStatus).json(result);
};

router.get('/warehouses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await vyom.listWarehouses();
    handleVyomResponse(res, result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/warehouses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await vyom.createWarehouse(req.body);
    handleVyomResponse(res, result, 201);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/warehouses/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await vyom.updateWarehouse(req.params.id, req.body);
    handleVyomResponse(res, result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/warehouses/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await vyom.deleteWarehouse(req.params.id);
    handleVyomResponse(res, result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/warehouses/:id/restore', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await vyom.restoreWarehouse(req.params.id);
    handleVyomResponse(res, result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await vyom.listOrders(req.query);
    handleVyomResponse(res, result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
