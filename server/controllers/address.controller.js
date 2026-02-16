const { validationResult } = require('express-validator');
const { addPickupLocation, getPickupLocations } = require('../utils/shiprocket');

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

const addShiprocketPickupLocation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const pickupData = {
      ...req.body,
      phone: parseInt(req.body.phone, 10),
      pin_code: parseInt(req.body.pin_code, 10),
    };
    
    // Call Shiprocket API
    const data = await addPickupLocation(pickupData);
    
    if (data.success) {
      // Save to DB
      await prisma.address.create({
        data: {
          user_id: userId,
          name: req.body.name,
          phone: req.body.phone,
          email: req.body.email,
          complete_address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          pincode: req.body.pin_code.toString(),
          country: req.body.country || 'India',
          is_shiprocket_pickup: true,
          pickup_nickname: req.body.pickup_location,
          address_label: req.body.pickup_location,
        }
      });
    }
    
    res.status(data.success ? 200 : 400).json({...data , msg : "Pickup address successfully added"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getShiprocketPickupLocations = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const addresses = await prisma.address.findMany({
      where: {
        user_id: userId,
        is_shiprocket_pickup: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Format to match the previous API response structure for frontend compatibility
    const formattedData = {
      success: true,
      data: {
        shipping_address: addresses.map(addr => ({
          id: addr.id,
          pickup_location: addr.pickup_nickname,
          name: addr.name,
          email: addr.email,
          phone: addr.phone,
          address: addr.complete_address,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          pin_code: addr.pincode
        }))
      }
    };

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  addShiprocketPickupLocation,
  getShiprocketPickupLocations
};
