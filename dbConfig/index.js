import mongoose from 'mongoose';

export default async function connect() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        const connect = mongoose.connection;

        connect.on('connected', () => console.log('MongoDB connected'));
        connect.on('error', (err) => {
            console.log(err)
            process.exit();
        });
    } catch (e) {
        console.log(e);
    }
}