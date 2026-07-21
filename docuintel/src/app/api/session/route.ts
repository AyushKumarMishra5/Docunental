/**
 * Session initialization API route
 * Creates and sets session cookie with MongoDB persistence
 */

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '@/lib/db';

const SESSION_COOKIE_NAME = 'docuintel_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function POST() {
  try {
    const sessionId = uuidv4();
    
    // Save session to MongoDB
    await DatabaseService.upsertSession(sessionId);
    
    const response = NextResponse.json({ sessionId });
    
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to create session' }, { status: 405 });
}
