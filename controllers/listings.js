const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
    let filter = {};
    if(req.query.location) {
        // Use case-insensitive regex for partial matches
        filter.location = { $regex: req.query.location, $options: 'i' };
    }
    
    const allListings = await Listing.find(filter);
    
    if(allListings.length === 0 && req.query.location) {
        req.flash("error", "No listings found for the location you searched.");
        return res.redirect("/listings");
    }
    
    res.render("listings/app.ejs", {allListings});
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: { path: "author"}}).populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing }); 
};

module.exports.createListing = async (req, res, next) => {
        let url = req.file.path;
        let filename = req.file.filename;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url, filename};

        try {
            const address = `${req.body.listing.location}, ${req.body.listing.country}`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
                headers: { 'User-Agent': 'WanderLustApp/1.0' }
            });
            const data = await response.json();
            if(data && data.length > 0) {
                newListing.geometry = { type: 'Point', coordinates: [data[0].lon, data[0].lat] };
            } else {
                newListing.geometry = { type: 'Point', coordinates: [77.2090, 28.6139] };
            }
        } catch (err) {
            console.log(err);
            newListing.geometry = { type: 'Point', coordinates: [77.2090, 28.6139] };
        }

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    try {
        const address = `${req.body.listing.location}, ${req.body.listing.country}`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
            headers: { 'User-Agent': 'WanderLustApp/1.0' }
        });
        const data = await response.json();
        if(data && data.length > 0) {
            listing.geometry = { type: 'Point', coordinates: [data[0].lon, data[0].lat] };
        }
    } catch (err) {
        console.log("Geocoding failed during update", err);
    }

    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }
    
    await listing.save();
    
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    // console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

// Code to update the listing image
