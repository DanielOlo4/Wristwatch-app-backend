const Cart = require("../models/Cart");
const Watch = require("../models/Watch");
const User = require("../models/User");
const paystack = require("paystack-api")(process.env.PAYSTACK_SECRET_KEY);

// Add item to cart
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

// Get all items in user's cart
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
        
        // Create full image URL for frontend
        if (item.watch.image) {
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://wristwatch-app-backend.onrender.com'
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

// Initialize Payment - ENHANCED VERSION
const initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deliveryAddress, deliveryPhone, orderId } = req.body;
    
    // ✅ ENHANCED DEBUGGING
    console.log('=== PAYMENT DEBUGGING START ===');
    console.log('🔍 Full request body:', req.body);
    console.log('👤 User ID from token:', userId);
    console.log('📦 Delivery Address:', deliveryAddress);
    console.log('📱 Delivery Phone:', deliveryPhone);
    console.log('🆔 Order ID:', orderId);
    console.log('🔑 User from token object:', req.user);
    console.log('=== PAYMENT DEBUGGING END ===');

    // ✅ Get user email from database
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found in database for ID:', userId);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.email) {
      console.log('❌ User email not found for user:', user._id);
      return res.status(400).json({
        success: false,
        message: "User email is required for payment"
      });
    }

    const email = user.email;
    console.log('✅ User email retrieved:', email);

    // ✅ IMPROVED VALIDATION WITH DETAILED ERRORS
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!email) missingFields.push('email');
    if (!deliveryAddress) missingFields.push('deliveryAddress');
    if (!deliveryPhone) missingFields.push('deliveryPhone');

    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `All fields are required. Missing: ${missingFields.join(', ')}`,
        missingFields: missingFields
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

    console.log('🛒 Cart items found:', cartItems.length);

    // Calculate total price
    let totalPrice = 0;
    cartItems.forEach(item => {
      if (item.watch && item.watch.price) {
        totalPrice += item.watch.price * item.quantity;
      }
    });

    console.log('💰 Calculated subtotal:', totalPrice);

    // Add shipping and tax
    const shippingFee = 1000; // ₦1000
    const taxRate = 0.075; // 7.5%
    const tax = totalPrice * taxRate;
    const finalTotal = totalPrice + shippingFee + tax;

    console.log('📊 Final total with shipping & tax:', finalTotal);

    // Update cart items with delivery info
    await Cart.updateMany(
      { user: userId },
      {
        deliveryAddress: deliveryAddress,
        deliveryPhone: deliveryPhone,
        totalPrice: finalTotal,
        shippingFee: shippingFee,
        tax: tax
      }
    );

    // ✅ ENHANCED REFERENCE GENERATION
    const reference = orderId 
      ? `order_${orderId}_${Date.now()}`
      : `watch_${userId}_${Date.now()}`;

    // ✅ ENHANCED CALLBACK URL
    const baseUrl = process.env.BASE_URL || 'https://wristwatch-app-backend.onrender.com';
    const callbackUrl = orderId 
      ? `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/payment-callback`
      : `${baseUrl}/api/cart/verify-payment/${reference}`;

    console.log('🔗 Callback URL:', callbackUrl);

    // ✅ ENHANCED PAYSTACK PAYLOAD
    const paymentData = {
      email: email,
      amount: Math.round(finalTotal * 100), // Convert to kobo
      currency: 'NGN',
      reference: reference,
      callback_url: callbackUrl,
      metadata: {
        userId: userId.toString(),
        cartItems: cartItems.length,
        deliveryAddress: deliveryAddress,
        deliveryPhone: deliveryPhone,
        totalAmount: finalTotal,
        ...(orderId && { orderId: orderId }) // ✅ Conditionally add orderId
      }
    };

    console.log('💰 Payment Data sent to Paystack:', paymentData);

    // Paystack API call with error handling
    try {
      const paystackResponse = await paystack.transaction.initialize(paymentData);

      console.log('📡 Paystack Response:', paystackResponse);

      if (paystackResponse.status) {
        // Update cart with payment reference
        await Cart.updateMany(
          { user: userId },
          {
            paymentReference: reference,
            paystackAccessCode: paystackResponse.data.access_code
          }
        );

        // ✅ If orderId exists, update order with payment reference
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            paymentReference: reference,
            paystackAccessCode: paystackResponse.data.access_code
          });
        }

        return res.status(201).json({
          success: true,
          message: "Payment initialization successful",
          data: {
            authorization_url: paystackResponse.data.authorization_url,
            access_code: paystackResponse.data.access_code,
            reference: reference,
            amount: finalTotal,
            shipping: shippingFee,
            tax: tax,
            subtotal: totalPrice,
            orderId: orderId || null // ✅ Include orderId in response
          },
        });
      } else {
        console.log('❌ Paystack error:', paystackResponse.message);
        return res.status(400).json({
          success: false,
          message: "Payment initialization failed",
          error: paystackResponse.message,
        });
      }
    } catch (paystackError) {
      console.error('❌ Paystack API error:', paystackError);
      return res.status(500).json({
        success: false,
        message: "Payment service temporarily unavailable",
        error: paystackError.message
      });
    }
  } catch (error) {
    console.error("Initialize payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment initialization"
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

    console.log('🔍 Verifying payment reference:', reference);

    const paystackResponse = await paystack.transaction.verify({ reference });

    console.log('📊 Paystack verification response:', paystackResponse);

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
          deliveryStatus: "processing",
          paymentStatus: "completed",
          transactionData: paystackResponse.data
        }
      );

      // Get updated cart items
      const updatedCartItems = await Cart.find({ paymentReference: reference }).populate('watch');

      return res.status(200).json({
        success: true,
        message: "Payment successful! Your order has been confirmed.",
        data: {
          cartItems: updatedCartItems,
          status: "paid",
          transaction: paystackResponse.data,
          orderNumber: reference,
          deliveryInfo: {
            address: updatedCartItems[0]?.deliveryAddress,
            phone: updatedCartItems[0]?.deliveryPhone
          }
        },
      });
    }

    // If payment not successful
    return res.status(400).json({
      success: false,
      message: "Payment verification failed or payment was not successful",
      data: paystackResponse.data
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    const cartItems = await Cart.find({ 
      paymentReference: reference, 
      user: userId 
    }).populate('watch');

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: {
        order: cartItems,
        paymentStatus: cartItems[0].isPaid ? "paid" : "pending",
        orderStatus: cartItems[0].orderStatus,
        deliveryStatus: cartItems[0].deliveryStatus
      }
    });

  } catch (error) {
    console.error("Get payment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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
  verifyPayment,
  getPaymentStatus 
};