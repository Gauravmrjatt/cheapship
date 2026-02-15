const { validationResult } = require('express-validator');

const getAddresses = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const createAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { 
    name, 
    phone, 
    email, 
    complete_address, 
    city, 
    state, 
    pincode, 
    address_label, 
    is_default 
  } = req.body;

  try {
    if (is_default) {
      // Set all other addresses of this user to is_default: false
      await prisma.address.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        user_id: userId,
        name,
        phone,
        email,
        complete_address,
        city,
        state,
        pincode,
        address_label,
        is_default: !!is_default
      }
    });
    res.status(201).json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateAddress = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { 
    name, 
    phone, 
    email, 
    complete_address, 
    city, 
    state, 
    pincode, 
    address_label, 
    is_default 
  } = req.body;

  try {
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress || existingAddress.user_id !== userId) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        complete_address,
        city,
        state,
        pincode,
        address_label,
        is_default: !!is_default
      }
    });
    res.json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress || existingAddress.user_id !== userId) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id }
    });
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
