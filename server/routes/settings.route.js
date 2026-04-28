const express = require('express');
const router = express.Router();

// Public endpoint to get security fee configuration for order calculation
router.get('/security-fee', async (req, res) => {
  const prisma = req.app.locals.prisma;
  
  try {
    const [feeTypeSetting, feeValueSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'security_fee_type' } }),
      prisma.systemSetting.findUnique({ where: { key: 'security_fee_value' } })
    ]);

    res.json({
      feeType: feeTypeSetting?.value || 'TIMES',
      feeValue: Number(feeValueSetting?.value) || 1
    });
  } catch (error) {
    console.error('Error fetching security fee config:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;