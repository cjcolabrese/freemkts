const mongoose = require("mongoose");

const RiaSchema = new mongoose.Schema({

    firmtype: {
        type: String,
        required: true
    },
    businessname: {
        type: String,
        required: true
    },
    legalname: {
        type: String,
        required: true
    },
    office: {
        type: String,
        required: true
    },
    officecity: {
        type: String,
        required: true
    },
    officestate: {
        type: String,
        required: true
    },
    officecountry: {
        type: String,
        required: true
    },
    zipcode: {
        type: String,
        required: true
    },
    telphone: {
        type: String,
        required: true
    },
    fax: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    effectivedate: {
        type: String,
        required: true
    },
    lastfiling: {
        type: String,
        required: true
    },
    website: {
        type: String,
        required: true
    }

    
});


module.exports = mongoose.model('RIA', RiaSchema)



