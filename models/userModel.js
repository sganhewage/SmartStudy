import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    sessions: [
        {
            name: { type: String, required: true },
            description: { type: String, default: '' },
            files: { type: [String], default: [] }, // store file URLs or paths
            instruction: { type: String, default: '' },
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

const User = mongoose.models.users || mongoose.model('users', userSchema);

export default User;