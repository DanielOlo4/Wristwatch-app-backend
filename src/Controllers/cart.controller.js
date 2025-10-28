const Cart = require("../models/Cart");
const Watch = require("../models/Watch");
const paystack = require("paystack-api")(process.env.PAYSTACK_SECRET_KEY);

// Add item
const addItem = async (req, res) => {
  try {
    const { watchId, quantity } = req.body;
    const userId = req.user.id;

    console.log("User ID from token:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    // Get watch details to get the price
    const watch = await Watch.findById(watchId);
    
    if (!watch) {
      return res.status(404).json({
        success: false,
        message: "Watch not found"
      });
    }

    const watchPrice = watch.price || 0;
    const totalItemPrice = watchPrice * (quantity || 1);

    // Check if item already exists
    let item = await Cart.findOne({ user: userId, watch: watchId });
    if (item) {
      item.quantity += quantity || 1;
      item.totalItemPrice = watchPrice * item.quantity;
    } else {
      item = new Cart({ 
        user: userId, 
        watch: watchId, 
        quantity: quantity || 1,
        price: watchPrice,
        totalItemPrice: totalItemPrice
      });
    }
    await item.save();

    res.status(201).json({ 
      success: true, 
      data: item 
    });
  } catch (err) {
    console.error("Add item error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Get all items in user's cart - FIXED VERSION
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    const items = await Cart.find({ user: userId })
      .populate({
        path: "watch",
        select: "name brand price image description type"
      });
    
    // Calculate total price and enhance with image URLs
    let totalPrice = 0;
    const enhancedItems = items.map(item => {
      if (item.watch && item.watch.price) {
        item.totalItemPrice = (item.watch.price || 0) * (item.quantity || 1);
        totalPrice += item.totalItemPrice;
        
        // ✅ FIXED: Create full image URL for frontend
        if (item.watch.image) {
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? process.env.BACKEND_URL || 'https://your-live-domain.com'
            : 'http://localhost:5000';
          item.watch.imageUrl = `${baseUrl}/uploads/${item.watch.image}`;
        }
      }
      return item;
    });

    res.json({ 
      success: true, 
      data: enhancedItems,
      totalPrice: totalPrice
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Update an item by itemId & userId
const updateItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    const item = await Cart.findOne({ _id: itemId, user: userId }).populate('watch');
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not found" 
      });
    }

    // Update quantity and recalculate totalItemPrice
    item.quantity = quantity;
    if (item.watch && item.watch.price) {
      item.totalItemPrice = (item.watch.price || 0) * (quantity || 1);
    } else {
      item.totalItemPrice = (item.price || 0) * (quantity || 1);
    }
    
    await item.save();

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Remove an item by itemId & userId
const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    const item = await Cart.findOneAndDelete({ _id: itemId, user: userId });
    if (!item) {
      return res.status(404).json({
        success: false, 
        message: "Item not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Item removed" 
    });
  } catch (err) {
    console.error("Remove item error:", err);
    res.status(500).json({
      success: false,
      message: err.message 
    });
  }
};

// Checkout
const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      deliveryAddress, 
      deliveryPhone, 
      paymentMethod, 
      paymentReference,
      paystackAccessCode 
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    // Get cart items to calculate total
    const cartItems = await Cart.find({ user: userId }).populate('watch');
    let totalPrice = 0;
    
    cartItems.forEach(item => {
      if (item.watch && item.watch.price) {
        totalPrice += item.watch.price * item.quantity;
      }
    });

    // Update cart items with checkout information
    await Cart.updateMany(
      { user: userId },
      {
        deliveryStatus: "pending",
        deliveryAddress,
        deliveryPhone,
        paymentMethod: paymentMethod || "card",
        paymentReference,
        paystackAccessCode,
        totalPrice,
        isPaid: true,
        paidAt: new Date(),
        orderStatus: "Paid"
      }
    );

    res.json({
      success: true,
      message: "Checkout complete",
      totalPrice: totalPrice
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Add multiple items to cart
const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartedItems } = req.body;

    console.log("User ID:", userId);
    console.log("cartedItems:", cartedItems);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    if (!cartedItems || !Array.isArray(cartedItems)) {
      return res.status(400).json({
        success: false,
        message: "cartedItems must be an array",
      });
    }

    const savedItems = [];

    for (const cartItem of cartedItems) {
      const { itemId, quantity } = cartItem;

      // Get watch details to get the price
      const watch = await Watch.findById(itemId);
      if (!watch) {
        console.log(`Watch with ID ${itemId} not found, skipping`);
        continue;
      }

      const watchPrice = watch.price || 0;
      const totalItemPrice = watchPrice * (quantity || 1);

      let existing = await Cart.findOne({ user: userId, watch: itemId });

      if (existing) {
        existing.quantity += quantity || 1;
        existing.totalItemPrice = watchPrice * existing.quantity;
        await existing.save();
        savedItems.push(existing);
      } else {
        const newItem = new Cart({
          user: userId,
          watch: itemId,
          quantity: quantity || 1,
          price: watchPrice,
          totalItemPrice: totalItemPrice
        });
        await newItem.save();
        savedItems.push(newItem);
      }
    }
    
    res.status(201).json({
      success: true,
      data: savedItems,
    });
  } catch (err) {
    console.error("Add multiple items error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Initialize Payment
const initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const { deliveryAddress, deliveryPhone } = req.body;
    
    if (!userId || !email || !deliveryAddress || !deliveryPhone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Get user cart items
    const cartItems = await Cart.find({ user: userId }).populate('watch');
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Calculate total price
    let totalPrice = 0;
    cartItems.forEach(item => {
      if (item.watch && item.watch.price) {
        totalPrice += item.watch.price * item.quantity;
      }
    });

    // Update cart items with delivery info
    await Cart.updateMany(
      { user: userId },
      {
        deliveryAddress: deliveryAddress,
        deliveryPhone: deliveryPhone,
        totalPrice: totalPrice
      }
    );

    const reference = `watchorder_${userId}_${Date.now()}`;

    // Paystack payload
    const paymentData = {
      email: email,
      amount: Math.round(totalPrice * 100),
      currency: 'NGN',
      reference: reference,
      metadata: {
        userId: userId.toString(),
        cartItems: cartItems.length
      }
    };

    // Paystack API call
    const paystackResponse = await paystack.transaction.initialize(paymentData);

    if (paystackResponse.status) {
      // Update cart with payment reference
      await Cart.updateMany(
        { user: userId },
        {
          paymentReference: reference,
          paystackAccessCode: paystackResponse.data.access_code
        }
      );

      return res.status(201).json({
        success: true,
        message: "Payment initialization successful",
        data: {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code,
          reference: reference,
          amount: totalPrice
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment initialization failed",
        error: paystackResponse.message,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    const paystackResponse = await paystack.transaction.verify({ reference });

    if (paystackResponse.status && paystackResponse.data.status === "success") {
      // Find cart items with this reference
      const cartItems = await Cart.find({ paymentReference: reference }).populate('watch');

      if (!cartItems || cartItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart items not found for this payment reference",
        });
      }

      // Check if already paid
      if (cartItems[0].isPaid) {
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
          data: {
            cartItems,
            status: "already_paid",
            transaction: paystackResponse.data,
          },
        });
      }

      // Update cart items payment status
      await Cart.updateMany(
        { paymentReference: reference },
        {
          isPaid: true,
          paidAt: new Date(),
          orderStatus: "Paid",
          deliveryStatus: "pending"
        }
      );

      // Get updated cart items
      const updatedCartItems = await Cart.find({ paymentReference: reference }).populate('watch');

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        data: {
          cartItems: updatedCartItems,
          status: "paid",
          transaction: paystackResponse.data,
        },
      });
    }

    // If payment not successful
    return res.status(400).json({
      success: false,
      message: "Payment verification failed",
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { 
  addItem, 
  getCart, 
  updateItem, 
  removeItem, 
  checkout, 
  addItemToCart,
  initializePayment, 
  verifyPayment 
};