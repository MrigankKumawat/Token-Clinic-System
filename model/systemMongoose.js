    import mongoose from "mongoose";
    const bookingSchema = new mongoose.Schema({
        name: String,
        phone: Number,
        date: Date,
        tokenNumber: {type: Number, default: 0},
        isCurrent: Boolean 
    })
    export const bookingModel = mongoose.model("BookingUser", bookingSchema)