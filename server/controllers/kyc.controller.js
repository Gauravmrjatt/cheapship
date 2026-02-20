const updateKyc = async (req, res) => {
  const { pan_number, aadhaar_number, gst_number } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    if (pan_number !== undefined && pan_number !== null && pan_number !== '') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(pan_number.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid PAN number format' });
      }
    }

    if (aadhaar_number !== undefined && aadhaar_number !== null && aadhaar_number !== '') {
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(aadhaar_number)) {
        return res.status(400).json({ message: 'Invalid Aadhaar number format' });
      }
    }

    if (gst_number !== undefined && gst_number !== null && gst_number !== '') {
      const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[Z]{1}\d{1}$/;
      if (!gstRegex.test(gst_number.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid GST number format' });
      }
    }

    const updateData = {};
    if (pan_number !== undefined) updateData.pan_number = pan_number ? pan_number.toUpperCase() : null;
    if (aadhaar_number !== undefined) updateData.aadhaar_number = aadhaar_number || null;
    if (gst_number !== undefined) updateData.gst_number = gst_number ? gst_number.toUpperCase() : null;

    const hasAnyKyc = pan_number || aadhaar_number || gst_number;
    if (hasAnyKyc) {
      updateData.kyc_status = 'SUBMITTED';
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({ message: 'KYC details updated successfully' });
  } catch (error) {
    console.error('Update KYC error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getKycStatus = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pan_number: true,
        pan_verified: true,
        aadhaar_number: true,
        aadhaar_verified: true,
        gst_number: true,
        gst_verified: true,
        kyc_status: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  updateKyc,
  getKycStatus
};
