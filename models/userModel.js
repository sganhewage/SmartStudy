import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    fileName: String,
    fileType: String,
    gridFsId: String
}, { _id: false });

const sessionSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' }, // renamed to match frontend
    files: [fileSchema],
    generationList: [String], // array of selected generation options
    configMap: mongoose.Schema.Types.Mixed, // accepts dynamic structure
    // createdAt: { type: Date, default: Date.now },
    // updatedAt: { type: Date, default: Date.now }
}, {timestamps: true});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    sessions: [sessionSchema]
});

const User = mongoose.models.users || mongoose.model('users', userSchema);

export default User;
