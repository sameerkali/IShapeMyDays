import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

declare global {
    // eslint-disable-next-line no-var
    var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global.__mongoose;

if (!cached) {
    cached = global.__mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri!, {
            dbName: "ishapemydays",
            bufferCommands: false,
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
