import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema
const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validationResult = signupSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.flatten().fieldErrors,
                    success: false
                },
                { status: 400 } // bad request
            );
        }

        const { name, email, password } = validationResult.data;

        await connectToDatabase();

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return NextResponse.json(
                { 
                    error: "User with this email already exists",
                    success: false
                },
                { status: 409 } // Conflict
            );
        }

        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({
            name,
            email: email,
            passwordHash,
            trainingPlans: [],
            totalWorkoutsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: newUser._id.toString(),
                    name: newUser.name,
                    email: newUser.email,
                },
                success: true
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                success: false
            },
            { status: 500 }
        );
    }
}