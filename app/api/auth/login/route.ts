import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';

const DEMO_EMAIL = 'admin@airline.com';
const DEMO_PASSWORD = 'password123';

async function ensureDemoAdminUser() {
  const existingDemo = await User.findOne({ email: DEMO_EMAIL });
  if (!existingDemo) {
    await User.create({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: 'Administrator',
      role: 'admin',
      isActive: true,
    });
    return;
  }

  const isCorrectPassword = await existingDemo.comparePassword(DEMO_PASSWORD);
  if (!isCorrectPassword) {
    existingDemo.password = DEMO_PASSWORD;
    await existingDemo.save();
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    await ensureDemoAdminUser();

    let body: { email?: string; password?: string };

    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Login parse error:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'User account is inactive' }, { status: 403 });
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
