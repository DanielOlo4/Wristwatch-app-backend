const Watch = require("../models/Watch");

// Helper function to get image URL
const getImageUrl = (filename) => {
  if (!filename) return null;
  return `http://localhost:5000/uploads/${filename}`;
};

// CREATE watch
const create = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const { name, brand, type, description, price } = req.body;
    
    // Validation
    if (!name || !brand || !type || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newWatch = new Watch({
      name,
      brand,
      type, 
      description,
      price: Number(price),
      image: req.file.filename,
    });

    await newWatch.save();
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...newWatch.toObject(),
        imageUrl: getImageUrl(req.file.filename)
      },
      message: "Watch created successfully"
    });
    
  } catch (err) {
    console.error("Create watch error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// UPDATE watch
const update = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If new image uploaded, update image field
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const watch = await Watch.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!watch) {
      return res.status(404).json({ 
        success: false, 
        message: "Watch not found" 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...watch.toObject(),
        imageUrl: getImageUrl(watch.image)
      },
      message: "Watch updated successfully" 
    });
    
  } catch (err) {
    console.error("Update watch error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// LIST all watches (PUBLIC)
const list = async (req, res) => {
  try {
    const { search } = req.query;
    const q = {};
    
    if (search) {
      const re = new RegExp(search, "i");
      q.$or = [
        { name: re },
        { brand: re },
        { type: re },
        { description: re },
      ];
    }
    
    const watches = await Watch.find(q).sort({ createdAt: -1 }).limit(200);

    // Add image URLs to all watches
    const watchesWithUrls = watches.map(watch => ({
      ...watch.toObject(),
      imageUrl: getImageUrl(watch.image)
    }));

    res.json({ 
      success: true, 
      data: watchesWithUrls 
    });
    
  } catch (err) {
    console.error("Error fetching watches:", err.message);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// GET watch by ID
const getById = async (req, res) => {
  try {
    const watch = await Watch.findById(req.params.id);
    
    if (!watch) {
      return res.status(404).json({ 
        success: false, 
        message: "Watch not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        ...watch.toObject(),
        imageUrl: getImageUrl(watch.image)
      }
    });
    
  } catch (err) {
    console.error("Get watch error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// DELETE watch
const remove = async (req, res) => {
  try {
    const watch = await Watch.findByIdAndDelete(req.params.id);
    
    if (!watch) {
      return res.status(404).json({ 
        success: false, 
        message: "Watch not found" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Watch deleted successfully" 
    });
    
  } catch (err) {
    console.error("Delete watch error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Remove getAllWatches function since we have list function

module.exports = { 
  create, 
  update, 
  remove, 
  list, 
  getById 
};